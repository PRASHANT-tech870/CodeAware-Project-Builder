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
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [verifyingQuiz, setVerifyingQuiz] = useState(false);
  const [projectCompleted, setProjectCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [streamlitExecutionId, setStreamlitExecutionId] = useState(null);

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
    console.log(`Code changed for ${language}:`, code ? code.substring(0, 20) + "..." : "empty");
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

  const cleanupStreamlit = async () => {
    if (streamlitExecutionId) {
      try {
        await axios.post('http://localhost:8000/terminate_streamlit', {
          execution_id: streamlitExecutionId
        });
        setStreamlitExecutionId(null);
      } catch (err) {
        console.error('Error terminating Streamlit process:', err);
      }
    }
  };
  
  useEffect(() => {
    return () => {
      // Cleanup Streamlit processes when component unmounts
      cleanupStreamlit();
    };
  }, []);

  const handleCodeSubmit = async (code, language) => {
    // Clean up any previous Streamlit process first
    await cleanupStreamlit();
    
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

        // If this is a Streamlit app, keep track of the execution ID
        if (response.data.is_streamlit && !response.data.streamlit_error) {
          setStreamlitExecutionId(response.data.execution_id);
        }

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

  const handleCompleteStep = async () => {
    // Show the quiz when the user wants to complete a step
    setShowQuiz(true);
    setLoadingQuestions(true);
    setError(null);
    
    try {
      // Get quiz questions for this step
      const response = await axios.post('http://localhost:8000/get_step_questions', {
        session_id: sessionData.sessionId,
        step_number: currentStep
      });
      
      if (response.data && response.data.questions) {
        setQuizQuestions(response.data.questions);
        
        // Initialize answer state for each question
        const initialAnswers = {};
        response.data.questions.forEach(q => {
          initialAnswers[q.question_id] = '';
        });
        setUserAnswers(initialAnswers);
      } else {
        setError('Failed to load quiz questions');
      }
    } catch (err) {
      console.error('Error fetching quiz questions:', err);
      setError('Failed to load quiz questions. Please try again.');
      setShowQuiz(false);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    
    // Check if all questions are answered
    const unansweredQuestions = Object.entries(userAnswers).filter(([_, answer]) => !answer).length;
    if (unansweredQuestions > 0) {
      setError(`Please answer all ${unansweredQuestions} remaining questions before proceeding.`);
      return;
    }
    
    setVerifyingQuiz(true);
    setError(null);
    
    try {
      // Format answers for submission
      const formattedAnswers = quizQuestions.map(question => ({
        question_id: question.question_id,
        answer: userAnswers[question.question_id],
        correct_answer: question.correct_answer
      }));
      
      const response = await axios.post('http://localhost:8000/verify_step_completion', {
        session_id: sessionData.sessionId,
        step_number: currentStep,
        user_answers: formattedAnswers
      });
      
      setQuizResult(response.data);
      
      // If all answers correct, proceed to next step after a delay
      if (response.data.correct) {
        setTimeout(() => {
          handleNextStep();
          setShowQuiz(false);
          setUserAnswers({});
          setQuizResult(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Error verifying quiz answers:', err);
      setError('Failed to verify your answers. Please try again.');
    } finally {
      setVerifyingQuiz(false);
    }
  };

  const handleNextStep = async () => {
    // Clean up any running Streamlit process
    await cleanupStreamlit();
    
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
        
        // Check if the project is completed
        if (nextStepData.project_completed) {
          setProjectCompleted(true);
          setCompletionMessage(nextStepData.message || "Congratulations! You have completed the project.");
          return;
        }
        
        // Add the new step to our steps array
        setProjectSteps(prev => [...prev, nextStepData]);
        setCurrentStep(prev => prev + 1);
        
        // User story change: Don't pre-fill code - let users type it themselves
        // We'll only set beginner starter code if it's the very first step (step 1)
        if (currentStep === 0 && sessionData.expertiseLevel === 'beginner' && nextStepData.code) {
          // Only for the first step, set starter code for beginners
          if (sessionData.projectType === 'html+css+js') {
            if (nextStepData.code.includes('<html')) {
              setHtmlCode(nextStepData.code);
              setCurrentLanguage('html');
            } else if (nextStepData.code.includes('style') && nextStepData.code.includes('{')) {
              setCssCode(nextStepData.code);
              setCurrentLanguage('css');
            } else {
              setJsCode(nextStepData.code);
              setCurrentLanguage('javascript');
            }
          } else { // python+streamlit
            setPythonCode(nextStepData.code);
            setCurrentLanguage('python');
          }
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

  if (projectCompleted) {
    return (
      <div className="project-builder">
        <div className="project-header">
          <div className="project-info">
            <h1>{projectDetails.title || 'Project Builder'}</h1>
            <p>{projectDetails.description || 'Build your project step by step'}</p>
          </div>
          <button className="reset-button" onClick={onReset}>
            Start New Project
          </button>
        </div>
        
        <div className="project-completed">
          <div className="completion-message">
            <h2>🎉 Project Completed! 🎉</h2>
            <p>{completionMessage}</p>
            <div className="completion-details">
              <h3>Project Summary</h3>
              <p>You've successfully completed all {projectDetails.totalSteps} steps of this project.</p>
              <p>Technology stack: {sessionData.projectType}</p>
              <p>Expertise level: {sessionData.expertiseLevel}</p>
            </div>
            <button className="new-project-button" onClick={onReset}>
              Start a New Project
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          
          {showQuiz ? (
            <div className="quiz-section">
              <h3>Before proceeding to the next step...</h3>
              <p>Please answer these questions about what you've learned:</p>
              
              {loadingQuestions ? (
                <div className="loading-quiz">Loading questions...</div>
              ) : (
                <form onSubmit={handleSubmitQuiz} className="quiz-form">
                  {quizQuestions.map((question, index) => (
                    <div key={question.question_id} className="quiz-question">
                      <p className="question-text"><strong>Question {index + 1}:</strong> {question.question_text}</p>
                      <div className="question-options">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="option-container">
                            <input
                              type="radio"
                              id={`${question.question_id}-${optIndex}`}
                              name={question.question_id}
                              value={option}
                              checked={userAnswers[question.question_id] === option}
                              onChange={() => handleAnswerSelect(question.question_id, option)}
                              disabled={verifyingQuiz}
                            />
                            <label htmlFor={`${question.question_id}-${optIndex}`}>{option}</label>
                          </div>
                        ))}
                      </div>
                      
                      {quizResult && quizResult.question_feedback && (
                        <div className={`feedback ${
                          quizResult.question_feedback.find(f => f.question_id === question.question_id)?.correct 
                            ? 'correct' 
                            : 'incorrect'
                        }`}>
                          {quizResult.question_feedback.find(f => f.question_id === question.question_id)?.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div className="quiz-controls">
                    <button 
                      type="submit"
                      disabled={verifyingQuiz || Object.values(userAnswers).some(a => !a)}
                      className="submit-quiz-btn"
                    >
                      {verifyingQuiz ? 'Checking...' : 'Submit Answers'}
                    </button>
                    
                    <button 
                      type="button"
                      className="cancel-quiz-btn"
                      onClick={() => setShowQuiz(false)}
                      disabled={verifyingQuiz}
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {quizResult && (
                    <div className={`quiz-result ${quizResult.correct ? 'correct' : 'incorrect'}`}>
                      <h4>{quizResult.correct ? '✅ Great work!' : '❌ Some answers were incorrect'}</h4>
                      <p>{quizResult.feedback}</p>
                      {quizResult.score && (
                        <div className="score-display">
                          Score: <span className="score-value">{quizResult.score}/100</span>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              )}
            </div>
          ) : (
            <div className="step-navigation">
              <button 
                className="next-step-button"
                onClick={handleCompleteStep}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Complete & Continue'}
              </button>
            </div>
          )}
          
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
              projectType={sessionData.projectType}
              currentCode={{
                html: htmlCode,
                css: cssCode,
                javascript: jsCode,
                python: pythonCode
              }}
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