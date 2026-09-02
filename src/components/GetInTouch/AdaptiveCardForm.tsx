import React, { useEffect, useRef, useState } from 'react';
import * as AdaptiveCards from 'adaptivecards';
// Import your CSS Module
import styles from './AdaptiveCardForm.module.css';

// ... (keep your cardPayload and POWER_AUTOMATE_URL definitions here)

const POWER_AUTOMATE_URL = 
'https://prod-00.westeurope.logic.azure.com:443/workflows/0e7f1c3b5d4e4a2b9c8f1c3b5d4e4a2b/triggers/manual/paths/invoke'

const cardPayload = {
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "width": "stretch", /* Changed from auto to allow columns to spread side-by-side naturally */
          "items": [
            {
              "type": "Input.Text",
              "id": "element-1784786382141-z2ppj4lw1",
              "placeholder": "",
              "label": "First name",
              "isRequired": true
            }
          ]
        },
        {
          "type": "Column",
          "width": "stretch", /* Changed from auto */
          "items": [
            {
              "type": "Input.Text",
              "id": "element-1784786389693-6gxd4po7t",
              "placeholder": "",
              "label": "Surname",
              "isRequired": true
            }
          ]
        }
      ]
    },
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "width": "stretch", /* Changed from auto */
          "items": [
            {
              "type": "Input.Text",
              "id": "element-1784786400043-728vv6lh8",
              "placeholder": "",
              "label": "Email",
              "style": "email",
              "isRequired": true
            }
          ]
        },
        {
          "type": "Column",
          "width": "stretch", /* Changed from auto */
          "items": [
            {
              "type": "Input.Text",
              "id": "element-1784786405848-95bzce6n9",
              "placeholder": "",
              "label": "Phone",
              "style": "tel"
            }
          ]
        }
      ]
    },
    {
      "type": "Input.ChoiceSet",
      "id": "element-1784786593713-xuctqkrsf",
      "label": "How can we help?",
      "style": "compact",
      "placeholder": "Choose...",
      "choices": [
        { "title": "Modern workplace", "value": "1" },
        { "title": "Business applications", "value": "2" },
        { "title": "Copilot", "value": "3" },
        { "title": "Help and support", "value": "4" }
      ],
      "isMultiSelect": false
    },
    {
      "type": "Input.Text",
      "id": "element-1784786740130-xjke2zjoy",
      "placeholder": "Enter text...",
      "label": "Message",
      "isMultiline": true,
      "isRequired": true
    }
    /* ⚠️ ActionSet has been safely removed from here */
  ],
  
  /*  Move actions here at the card payload root block level */
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Send message"
    }
  ]
}

export const AdaptiveCardForm: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!containerRef.current) return;

    const adaptiveCard = new AdaptiveCards.AdaptiveCard();

    // Use HostConfig for foundational spacing, let CSS handle decoration
    adaptiveCard.hostConfig = new AdaptiveCards.HostConfig({
      fontFamily: "Inter, Segoe UI, sans-serif",
      actions: {
        actionAlignment: "stretch"
      }
    });

    adaptiveCard.parse(cardPayload);

    adaptiveCard.onExecuteAction = async (action: AdaptiveCards.Action) => {
      if (action instanceof AdaptiveCards.SubmitAction) {
        const formData = action.data; 
        setStatus('submitting');
        try {
          const response = await fetch(POWER_AUTOMATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          if (response.ok) setStatus('success');
          else setStatus('error');
        } catch {
          setStatus('error');
        }
      }
    };

    const renderedCard = adaptiveCard.render();
    if (renderedCard) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(renderedCard);
    }
  }, []);

return (
  <div className={styles.cardContainer}>
    {/* The Adaptive Card injects its complete DOM tree safely inside here */}
    <div ref={containerRef} />

    {/* Separate container for statuses ensures proper spacing alignment */}
    {status !== 'idle' && (
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
        {status === 'submitting' && <p style={{ color: '#2563eb', margin: 0 }}>Sending...</p>}
        {status === 'success' && <p style={{ color: '#16a34a', margin: 0 }}>Submitted!</p>}
        {status === 'error' && <p style={{ color: '#dc2626', margin: 0 }}>Error occurred.</p>}
      </div>
    )}
  </div>
)};
