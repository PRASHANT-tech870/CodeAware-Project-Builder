import { useState } from 'react';
import axios from 'axios';
import '../styles/WelcomeScreen.css';

const WelcomeScreen = ({ onProjectStart }) => {
  const [projectType, setProjectType] = useState('');
  const [expertiseLevel, setExpertiseLevel] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectType || !expertiseLevel) {
      setError('Please select both project type and expertise level');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:8000/start_project', {
        project_type: projectType,
        expertise_level: expertiseLevel,
        project_idea: projectIdea || undefined
      });
      
      const { session_id, response: geminiResponse } = response.data;
      
      // Pass the data back to parent component
      onProjectStart({
        sessionId: session_id,
        projectType,
        expertiseLevel,
        projectIdea: projectIdea || 'AI suggested project',
        geminiResponse
      });
    } catch (err) {
      console.error('Error starting project:', err);
      setError('Failed to start project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-container">
        <div className="welcome-header">
          <h1>Welcome to AI-Guided Project Builder</h1>
          <p>
            Build real-world projects with step-by-step AI guidance. Choose your tech stack, 
            specify your expertise level, and let's start coding!
          </p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>What would you like to build?</h2>
            
            <div className="tech-choices">
              <div className="tech-choice">
                <input 
                  type="radio" 
                  id="python-streamlit" 
                  name="projectType" 
                  value="python+streamlit"
                  checked={projectType === 'python+streamlit'}
                  onChange={() => setProjectType('python+streamlit')}
                />
                <label htmlFor="python-streamlit">
                  <div className="tech-icon">🐍</div>
                  <div className="tech-name">Python + Streamlit</div>
                  <div className="tech-desc">Build data-focused web applications with Python</div>
                </label>
              </div>
              
              <div className="tech-choice">
                <input 
                  type="radio" 
                  id="html-css-js" 
                  name="projectType" 
                  value="html+css+js"
                  checked={projectType === 'html+css+js'}
                  onChange={() => setProjectType('html+css+js')}
                />
                <label htmlFor="html-css-js">
                  <div className="tech-icon">🌐</div>
                  <div className="tech-name">HTML + CSS + JS</div>
                  <div className="tech-desc">Create interactive websites with web technologies</div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>What's your expertise level?</h2>
            
            <div className="skill-levels">
              <div className="skill-level">
                <input 
                  type="radio" 
                  id="beginner" 
                  name="expertiseLevel" 
                  value="beginner"
                  checked={expertiseLevel === 'beginner'}
                  onChange={() => setExpertiseLevel('beginner')}
                />
                <label htmlFor="beginner">
                  <div className="skill-name">Beginner</div>
                  <p>I'm new to this technology</p>
                </label>
              </div>
              
              <div className="skill-level">
                <input 
                  type="radio" 
                  id="intermediate" 
                  name="expertiseLevel" 
                  value="intermediate"
                  checked={expertiseLevel === 'intermediate'}
                  onChange={() => setExpertiseLevel('intermediate')}
                />
                <label htmlFor="intermediate">
                  <div className="skill-name">Intermediate</div>
                  <p>I've built some small projects</p>
                </label>
              </div>
              
              <div className="skill-level">
                <input 
                  type="radio" 
                  id="expert" 
                  name="expertiseLevel" 
                  value="expert"
                  checked={expertiseLevel === 'expert'}
                  onChange={() => setExpertiseLevel('expert')}
                />
                <label htmlFor="expert">
                  <div className="skill-name">Expert</div>
                  <p>I'm comfortable with advanced concepts</p>
                </label>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>What would you like to build? (Optional)</h2>
            
            <div className="form-group">
              <label>Describe your project idea, or leave blank for AI suggestions</label>
              <textarea
                placeholder="E.g., A todo app with authentication, A weather dashboard, etc."
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                rows="3"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="start-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                <span className="button-text">Creating your project...</span>
              </>
            ) : (
              <span className="button-text">Start Building</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeScreen; 