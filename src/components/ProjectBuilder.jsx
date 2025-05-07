import { useState, useEffect } from 'react';
import axios from 'axios';
import CodeEditor from './CodeEditor';
import OutputDisplay from './OutputDisplay';
import ProjectStep from './ProjectStep';
import '../styles/ProjectBuilder.css';

const ProjectBuilder = ({ sessionData, onReset }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [projectSteps, setProjectSteps] = useState([]);
  const [projectDetails, setProjectDetails] = useState({});
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [pythonCode, setPythonCode] = useState('');
  const [combinedHtml, setCombinedHtml] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('html');
  const [userQuestion, setUserQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);

  useEffect(() => {
    // Parse the initial Gemini response when component mounts
    if (sessionData && sessionData.geminiResponse) {
      try {
        const responseObject = JSON.parse(sessionData.geminiResponse);
        setProjectDetails({
          title: responseObject.project_title,
          description: responseObject.project_description,
          totalSteps: responseObject.total_steps
        });
        
        if (responseObject.steps && responseObject.steps.length > 0) {
          setProjectSteps(responseObject.steps);
        }
      } catch (err) {
        console.error('Error parsing Gemini response:', err);
        setError('There was an issue setting up your project. Please try again.');
      }
    }
  }, [sessionData]);

  // Combine HTML and CSS when either changes
  useEffect(() => {
    if (htmlCode || cssCode) {
      const combined = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
        ${cssCode}
        </style>
        <script>
        ${jsCode}
        </script>
      </head>
      <body>
      ${htmlCode}
      </body>
      </html>
      `;
      setCombinedHtml(combined);
    }
  }, [htmlCode, cssCode, jsCode]);

  const handleCodeChange = (code, language) => {
    setCurrentLanguage(language);
    
    switch (language) {
      case 'html':
        setHtmlCode(code);
        break;
      case 'css':
        setCssCode(code);
        break;
      case 'javascript':
        setJsCode(code);
        break;
      case 'python':
        setPythonCode(code);
        break;
      default:
        break;
    }
  };

  const getCurrentCode = () => {
    switch (currentLanguage) {
      case 'html':
        return htmlCode;
      case 'css':
        return cssCode;
      case 'javascript':
        return jsCode;
      case 'python':
        return pythonCode;
      default:
        return '';
    }
  };

  const handleCodeSubmit = async (code, language) => {
    setIsLoading(true);
    setError(null);

    try {
      if (language === 'html' || language === 'css' || language === 'javascript') {
        // For HTML/CSS/JS, handle preview
        const response = await axios.post('http://localhost:8000/render_website', {
          html_code: htmlCode,
          css_code: cssCode
        });

        setExecutionResult({
          code,
          ...(language === 'html' ? { html_content: code } : 
             language === 'css' ? { css_content: code } : {}),
          exit_code: 0,
          stdout: '',
          stderr: ''
        });
      } else {
        // For Python, send to backend for execution
        const response = await axios.post('http://localhost:8000/execute', {
          code,
          language
        });

        setExecutionResult({
          ...response.data,
          code // Save the code that was executed
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during code execution');
      console.error('Error executing code:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Next step request payload:", {
        project_type: sessionData.projectType,
        expertise_level: sessionData.expertiseLevel,
        project_idea: sessionData.projectIdea,
        current_step: currentStep,
        user_code: getCurrentCode(),
        session_id: sessionData.sessionId
      });
      
      // Using the test endpoint for debugging
      const response = await axios.post('http://localhost:8000/next_step_test', {
        project_type: sessionData.projectType,
        expertise_level: sessionData.expertiseLevel,
        project_idea: sessionData.projectIdea,
        current_step: currentStep,
        user_code: getCurrentCode(),
        session_id: sessionData.sessionId
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log("Backend response:", response.data);
      
      const { response: geminiResponse } = response.data;
      
      try {
        const nextStepData = JSON.parse(geminiResponse);
        console.log("Parsed step data:", nextStepData);
        
        // Add the new step to our steps array
        setProjectSteps(prev => [...prev, nextStepData]);
        setCurrentStep(prev => prev + 1);
        
        // Set starter code based on the project type
        if (sessionData.projectType === 'html+css+js') {
          if (nextStepData.code && nextStepData.code.includes('<html')) {
            setHtmlCode(nextStepData.code);
            setCurrentLanguage('html');
          } else if (nextStepData.code && nextStepData.code.includes('style') && nextStepData.code.includes('{')) {
            setCssCode(nextStepData.code);
            setCurrentLanguage('css');
          } else if (nextStepData.code) {
            setJsCode(nextStepData.code);
            setCurrentLanguage('javascript');
          }
        } else { // python+streamlit
          setPythonCode(nextStepData.code || '');
          setCurrentLanguage('python');
        }
      } catch (err) {
        console.error('Error parsing step data:', err);
        console.error('Raw response:', geminiResponse);
        setError('There was an issue loading the next step. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching next step:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError('Failed to load the next step. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    
    if (!userQuestion.trim()) return;
    
    setAskingQuestion(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8000/ask_question', {
        question: userQuestion,
        code: getCurrentCode(),
        project_type: sessionData.projectType,
        session_id: sessionData.sessionId
      });
      
      setAiResponse(response.data.response);
      
      // Clear the question input
      setUserQuestion('');
    } catch (err) {
      console.error('Error asking question:', err);
      setError('Failed to get an answer. Please try again.');
    } finally {
      setAskingQuestion(false);
    }
  };

  return (
    <div className="project-builder">
      <div className="project-header">
        <div className="project-info">
          <h1>{projectDetails.title || 'Project Builder'}</h1>
          <p>{projectDetails.description || 'Build your project step by step'}</p>
          <div className="project-meta">
            <span className="tech-stack">Tech: {sessionData.projectType}</span>
            <span className="expertise">Level: {sessionData.expertiseLevel}</span>
            <span className="step-counter">
              Step {currentStep + 1} of {projectDetails.totalSteps || '?'}
            </span>
          </div>
        </div>
        <button className="reset-button" onClick={onReset}>
          Start New Project
        </button>
      </div>

      <div className="project-content">
        <div className="guidance-panel">
          <ProjectStep 
            stepData={projectSteps[currentStep]} 
            stepNumber={currentStep + 1}
          />
          
          <div className="step-navigation">
            <button 
              className="next-step-button"
              onClick={handleNextStep}
              disabled={isLoading || currentStep >= (projectDetails.totalSteps - 1)}
            >
              {isLoading ? 'Loading...' : 'Next Step'}
            </button>
          </div>
          
          <div className="question-section">
            <h3>Have a question?</h3>
            <form onSubmit={handleAskQuestion} className="question-form">
              <input
                type="text"
                placeholder="Ask the AI about your code..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                disabled={askingQuestion}
              />
              <button 
                type="submit" 
                disabled={askingQuestion || !userQuestion.trim()}
              >
                {askingQuestion ? 'Thinking...' : 'Ask'}
              </button>
            </form>
            
            {aiResponse && (
              <div className="ai-answer">
                <h4>AI Response:</h4>
                <div className="answer-content">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="coding-panel">
          <div className="editor-container">
            <CodeEditor 
              onCodeSubmit={handleCodeSubmit} 
              onCodeChange={handleCodeChange} 
              isLoading={isLoading}
              initialLanguage={
                sessionData.projectType === 'html+css+js' ? 'html' : 'python'
              }
            />
          </div>
          
          <div className="output-container">
            <OutputDisplay 
              executionResult={executionResult} 
              isLoading={isLoading}
              error={error}
              combinedHtml={combinedHtml}
            />
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default ProjectBuilder; 