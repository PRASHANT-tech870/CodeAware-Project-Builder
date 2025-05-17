import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

  // Custom renderer components for ReactMarkdown
  const components = {
    // Add the markdown-content class to the root div
    root: ({ node, ...props }) => <div className="markdown-content" {...props} />,
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      return !inline ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          wrapLines={true}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };
  
  return (
    <div className="project-step">
      <div className="step-number">{stepNumber}</div>
      <div className="step-content">
        <h3 className="step-title">{formattedTitle}</h3>
        
        {feedback && (
          <div className="step-feedback">
            <h4>Feedback on Your Code</h4>
            <div className="feedback-content">
              <ReactMarkdown components={components}>
                {feedback}
              </ReactMarkdown>
            </div>
          </div>
        )}
        
        <div className="step-description">
          <ReactMarkdown components={components}>
            {description}
          </ReactMarkdown>
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
              <ReactMarkdown components={components}>
                {expected_outcome}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {quiz_question && (
          <div className="step-quiz-question">
            <h4>Thinking Question</h4>
            <div className="quiz-question-content">
              <ReactMarkdown components={components}>
                {quiz_question}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStep; 