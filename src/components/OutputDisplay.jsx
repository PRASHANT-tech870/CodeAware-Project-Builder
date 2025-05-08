import React from 'react';
import '../styles/OutputDisplay.css';

const OutputDisplay = ({ executionResult, isLoading, error, combinedHtml }) => {
  if (isLoading) {
    return (
      <div className="output-display">
        <div className="output-header">
          <h3>Output</h3>
        </div>
        <div className="loading-output">
          <div className="loading-spinner"></div>
          <p>Running code...</p>
        </div>
      </div>
    );
  }

  // For HTML preview
  if (combinedHtml && (!executionResult || executionResult.html_content)) {
    return (
      <div className="output-display">
        <div className="output-header">
          <h3>Website Preview</h3>
        </div>
        <div className="html-preview">
          <iframe 
            srcDoc={combinedHtml} 
            title="HTML Preview" 
            sandbox="allow-scripts"
            width="100%" 
            height="100%"
          />
        </div>
      </div>
    );
  }

  // If there's an error message from the parent component
  if (error) {
    return (
      <div className="output-display">
        <div className="output-header">
          <h3>Output</h3>
        </div>
        <div className="error-output">
          <h4>Error:</h4>
          <pre>{error}</pre>
        </div>
      </div>
    );
  }

  // If there's no execution result yet
  if (!executionResult) {
    return (
      <div className="output-display">
        <div className="output-header">
          <h3>Output</h3>
        </div>
        <div className="empty-output">
          <p>Run your code to see output.</p>
        </div>
      </div>
    );
  }

  // Special handling for Streamlit apps
  if (executionResult.is_streamlit) {
    if (executionResult.streamlit_error) {
      // Display error if Streamlit failed to start
      return (
        <div className="output-display">
          <div className="output-header">
            <h3>Streamlit Error</h3>
          </div>
          <div className="error-output">
            <h4>Failed to run Streamlit app:</h4>
            <pre>{executionResult.stderr || executionResult.stdout || "Unknown error running Streamlit"}</pre>
          </div>
        </div>
      );
    }
    
    // Display running Streamlit app in iframe
    return (
      <div className="output-display">
        <div className="output-header">
          <h3>Streamlit App</h3>
          <div className="streamlit-url">
            <a href={executionResult.streamlit_url} target="_blank" rel="noopener noreferrer">
              {executionResult.streamlit_url}
            </a>
          </div>
        </div>
        <div className="streamlit-iframe-container">
          <iframe
            src={executionResult.streamlit_url}
            title="Streamlit App"
            width="100%"
            height="100%"
            allow="clipboard-read; clipboard-write"
            className="streamlit-iframe"
          />
        </div>
      </div>
    );
  }

  // For regular execution outputs
  return (
    <div className="output-display">
      <div className="output-header">
        <h3>Output</h3>
      </div>
      <div className="output-content">
        {executionResult.stdout && (
          <div className="stdout">
            <h4>Standard Output:</h4>
            <pre>{executionResult.stdout}</pre>
          </div>
        )}
        {executionResult.stderr && (
          <div className="stderr">
            <h4>Standard Error:</h4>
            <pre>{executionResult.stderr}</pre>
          </div>
        )}
        {!executionResult.stdout && !executionResult.stderr && (
          <div className="no-output">
            <p>Your code ran successfully, but produced no output.</p>
          </div>
        )}
        <div className="exit-code">
          Exit Code: <span className={executionResult.exit_code === 0 ? "success" : "error"}>
            {executionResult.exit_code}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OutputDisplay; 