import { useState, useEffect } from 'react';

const OutputDisplay = ({ executionResult, combinedHtml }) => {
  const [activeTab, setActiveTab] = useState('output');
  const [iframeKey, setIframeKey] = useState(0);
  
  useEffect(() => {
    if (executionResult?.html_content || executionResult?.css_content || combinedHtml) {
      setActiveTab('preview');
      // Force iframe refresh when content changes
      setIframeKey(prev => prev + 1);
    }
  }, [executionResult, combinedHtml]);
  
  if (!executionResult && !combinedHtml) {
    return (
      <div className="output-container">
        <div className="output-header">Output</div>
        <div className="output-content">
          <p>Code execution results will appear here.</p>
          <p>Select a language, write or modify the code, and click "Run Code" or "Render" to see the result.</p>
          <p>For HTML and CSS, you'll see a live preview of your website.</p>
        </div>
      </div>
    );
  }

  // For HTML and CSS content, we'll handle differently
  const isWebContent = executionResult?.html_content || executionResult?.css_content || combinedHtml;
  
  // For Python/JavaScript execution
  const { stdout, stderr, exit_code } = executionResult || {};
  const hasOutput = stdout && stdout.trim().length > 0;
  const hasError = stderr && stderr.trim().length > 0;

  const renderContent = () => {
    if (activeTab === 'preview' && isWebContent) {
      // Create a data URL for the iframe
      let htmlContent = '';
      
      if (combinedHtml) {
        htmlContent = combinedHtml;
      } else if (executionResult?.html_content) {
        htmlContent = executionResult.html_content;
      } else if (executionResult?.css_content) {
        // If only CSS, create a demo page to show it
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>${executionResult.css_content}</style>
          </head>
          <body>
            <h1>CSS Preview</h1>
            <p>This is a preview of your CSS styles.</p>
            <div class="container">
              <h2>Heading</h2>
              <p>Paragraph text</p>
              <button>Button</button>
              <a href="#">Link</a>
              <ul>
                <li>List item 1</li>
                <li>List item 2</li>
                <li>List item 3</li>
              </ul>
            </div>
          </body>
          </html>
        `;
      }
      
      const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      
      return (
        <div className="preview-container">
          <iframe
            key={iframeKey}
            src={dataUrl}
            title="Preview"
            className="preview-iframe"
            sandbox="allow-same-origin allow-scripts"
            width="100%"
            height="100%"
          />
        </div>
      );
    } else if (activeTab === 'output' && hasOutput) {
      return <pre className="output-stdout">{stdout}</pre>;
    } else if (activeTab === 'error' && hasError) {
      return <pre className="output-stderr">{stderr}</pre>;
    } else if (activeTab === 'code') {
      return <pre className="output-code">{executionResult?.code || ''}</pre>;
    } else {
      return <p>No {activeTab} to display.</p>;
    }
  };

  return (
    <div className="output-container">
      <div className="output-header">
        <div className="output-tabs">
          {isWebContent && (
            <button 
              className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
          )}
          <button 
            className={`tab-button ${activeTab === 'output' ? 'active' : ''}`}
            onClick={() => setActiveTab('output')}
          >
            Output
          </button>
          <button 
            className={`tab-button ${activeTab === 'error' ? 'active' : ''}`}
            onClick={() => setActiveTab('error')}
          >
            Errors
          </button>
          <button 
            className={`tab-button ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>
      </div>
      
      <div className="output-content">
        {renderContent()}
      </div>
      
      {!isWebContent && executionResult && (
        <div className="status-bar">
          <span>
            Status: 
            {exit_code === 0 ? (
              <span className="status-success"> Success (Exit Code: {exit_code})</span>
            ) : (
              <span className="status-error"> Error (Exit Code: {exit_code})</span>
            )}
          </span>
          <span>Execution ID: {executionResult.execution_id || 'N/A'}</span>
        </div>
      )}
    </div>
  );
};

export default OutputDisplay; 