import React, { useState } from 'react';
import { Alert, Button, Card, Modal } from 'react-bootstrap';
import { FaDatabase, FaExternalLinkAlt } from 'react-icons/fa';

/**
 * A component that guides users to create required Firebase indexes
 * when encountering Firestore index errors
 */
const FirebaseIndexHelper = ({ 
  show, 
  onHide, 
  indexUrl, 
  collectionName = 'orders',
  fieldNames = ['userId', 'createdAt']
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(indexUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaDatabase className="me-2" /> 
          Firebase Index Required
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="warning">
          <strong>Database Index Required</strong>
          <p>
            Firebase requires a special index to be created for this query to work. 
            This is a one-time setup.
          </p>
        </Alert>

        <Card className="mb-3 mt-4">
          <Card.Header>Option 1: Create Index via Link (Recommended)</Card.Header>
          <Card.Body>
            <p>Click the button below to open Firebase Console and create the required index:</p>
            <div className="d-flex gap-2">
              <Button
                variant="primary"
                href={indexUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaExternalLinkAlt className="me-2" />
                Create Index in Firebase Console
              </Button>
              <Button
                variant="outline-secondary"
                onClick={handleCopyLink}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>Option 2: Create Index Manually</Card.Header>
          <Card.Body>
            <ol className="mb-0">
              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
              <li>Select your project</li>
              <li>Go to <strong>Firestore Database</strong> &gt; <strong>Indexes</strong> tab</li>
              <li>Click <strong>Create Index</strong></li>
              <li>
                Enter these details:
                <ul>
                  <li>Collection: <code>{collectionName}</code></li>
                  <li>
                    Fields:
                    <ul>
                      {fieldNames.map((field, index) => (
                        <li key={index}>
                          <code>{field}</code> - {index === 0 ? 'Ascending' : 'Descending'}
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </li>
              <li>Click <strong>Create</strong></li>
            </ol>
          </Card.Body>
        </Card>

        <Alert variant="info" className="mt-3">
          <strong>Note:</strong> After creating the index, it may take a few minutes to become active.
          Please refresh the page after a few minutes.
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FirebaseIndexHelper;
