import React from 'react';
import '../styles/ProjectStep.css';

const ProjectStep = ({ stepData, stepNumber }) => {
  if (!stepData) {
    return (
      <div className="project-step loading">
        <div className="step-number">{stepNumber}</div>
        <div className="step-content">
          <h3>Loading step...</h3>
          <div className="step-loading-indicator">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const { title, description, code, expected_outcome, feedback, quiz_question } = stepData;
  
  // Ensure title has correct step number
  const displayTitle = title || `Step ${stepNumber}`;
  const formattedTitle = displayTitle.startsWith(`Step ${stepNumber}:`) ? 
    displayTitle : 
    `Step ${stepNumber}: ${displayTitle.replace(/^Step\s+\d+:\s*/, '')}`;
  
  return (
    <div className="project-step">
      <div className="step-number">{stepNumber}</div>
      <div className="step-content">
        <h3 className="step-title">{formattedTitle}</h3>
        
        {feedback && (
          <div className="step-feedback">
            <h4>Feedback on Your Code</h4>
            <div className="feedback-content">
              {feedback}
            </div>
          </div>
        )}
        
        <div className="step-description">
          {description}
        </div>
        
        {code && (
          <div className="step-code-example">
            <h4>Suggested Code</h4>
            <pre className="code-block">
              <code>{code}</code>
            </pre>
          </div>
        )}
        
        {expected_outcome && (
          <div className="step-expected">
            <h4>Expected Outcome</h4>
            <div className="expected-content">
              {expected_outcome}
            </div>
          </div>
        )}

        {quiz_question && (
          <div className="step-quiz-question">
            <h4>Thinking Question</h4>
            <div className="quiz-question-content">
              {quiz_question}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStep; 