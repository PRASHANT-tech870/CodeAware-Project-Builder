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
    <div className="welcome-container">
      <div className="welcome-content">
        <h1>Welcome to AI-Guided Project Builder</h1>
        <p className="welcome-desc">
          Build real-world projects with step-by-step AI guidance. Choose your tech stack, 
          specify your expertise level, and let's start coding!
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-section">
            <h2>What would you like to build?</h2>
            
            <div className="option-cards">
              <div 
                className={`option-card ${projectType === 'python+streamlit' ? 'selected' : ''}`}
                onClick={() => setProjectType('python+streamlit')}
              >
                <div className="card-icon">🐍</div>
                <h3>Python + Streamlit</h3>
                <p>Build data-focused web applications with Python</p>
              </div>
              
              <div 
                className={`option-card ${projectType === 'html+css+js' ? 'selected' : ''}`}
                onClick={() => setProjectType('html+css+js')}
              >
                <div className="card-icon">🌐</div>
                <h3>HTML + CSS + JS</h3>
                <p>Create interactive websites with web technologies</p>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>What's your expertise level?</h2>
            
            <div className="expertise-options">
              <label className={expertiseLevel === 'beginner' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="expertiseLevel" 
                  value="beginner"
                  checked={expertiseLevel === 'beginner'}
                  onChange={() => setExpertiseLevel('beginner')}
                />
                <span>Beginner</span>
                <p>I'm new to this technology</p>
              </label>
              
              <label className={expertiseLevel === 'intermediate' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="expertiseLevel" 
                  value="intermediate"
                  checked={expertiseLevel === 'intermediate'}
                  onChange={() => setExpertiseLevel('intermediate')}
                />
                <span>Intermediate</span>
                <p>I've built some small projects</p>
              </label>
              
              <label className={expertiseLevel === 'expert' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="expertiseLevel" 
                  value="expert"
                  checked={expertiseLevel === 'expert'}
                  onChange={() => setExpertiseLevel('expert')}
                />
                <span>Expert</span>
                <p>I'm comfortable with advanced concepts</p>
              </label>
            </div>
          </div>
          
          <div className="form-section">
            <h2>What would you like to build? (Optional)</h2>
            <p className="input-desc">Describe your project idea, or leave blank for AI suggestions</p>
            
            <textarea
              placeholder="E.g., A todo app with authentication, A weather dashboard, etc."
              value={projectIdea}
              onChange={(e) => setProjectIdea(e.target.value)}
              rows="3"
            />
          </div>
          
          <button 
            type="submit" 
            className="start-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating your project...' : 'Start Building'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeScreen; 