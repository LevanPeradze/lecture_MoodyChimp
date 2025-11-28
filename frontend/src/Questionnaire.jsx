import { useState } from 'react';
import './Questionnaire.css';

const Questionnaire = ({ userEmail, onComplete, onClose }) => {
  const [currentSection, setCurrentSection] = useState(1);
  const [answers, setAnswers] = useState({
    q1: '',
    q2: [],
    q3: [],
    q4: '',
    q5: '',
    q6: '',
    q7: '',
    q8: [],
    q9: '',
    q10: '',
    q11: '',
    q12: '',
    q13: '',
    q14: ''
  });

  const handleSingleAnswer = (question, value) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleMultipleAnswer = (question, value) => {
    setAnswers(prev => {
      const current = prev[question] || [];
      if (current.includes(value)) {
        return { ...prev, [question]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [question]: [...current, value] };
      }
    });
  };

  const handleNext = () => {
    if (currentSection < 5) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handleBack = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, answers })
      });
      const data = await response.json();
      if (data.success) {
        onComplete(data.optimalCourse);
      } else {
        console.error('Failed to submit questionnaire:', data.error);
      }
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
    }
  };

  const canProceed = () => {
    switch (currentSection) {
      case 1:
        return answers.q1 && answers.q2.length > 0 && answers.q3.length > 0;
      case 2:
        return answers.q4 && answers.q5 && answers.q6;
      case 3:
        return answers.q7 && answers.q8.length > 0;
      case 4:
        return answers.q9 && answers.q10 && answers.q11;
      case 5:
        return answers.q12 && answers.q13 && answers.q14;
      default:
        return false;
    }
  };

  return (
    <div className="questionnaire-overlay" onClick={onClose}>
      <div className="questionnaire-modal" onClick={(e) => e.stopPropagation()}>
        <button className="questionnaire-close" onClick={onClose}>×</button>
        
        <div className="questionnaire-header">
          <h2>MoodyChimp — Course Recommendation Questionnaire</h2>
          <div className="questionnaire-progress">
            Section {currentSection} of 5
          </div>
        </div>

        <div className="questionnaire-content">
          {currentSection === 1 && (
            <div className="questionnaire-section">
              <h3>Section 1 — Background & Experience</h3>
              
              <div className="questionnaire-question">
                <label>1. How would you describe your current skill level in digital art or creation?</label>
                {['Total beginner', 'Beginner (some attempts, no structured learning)', 'Intermediate (can complete small projects)', 'Advanced (professional or near-professional workflow)'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q1"
                      value={option}
                      checked={answers.q1 === option}
                      onChange={(e) => handleSingleAnswer('q1', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>2. Have you ever created any of the following? (Select all that apply)</label>
                {['Drawings or illustrations', 'Simple animations or motion studies', 'Game concepts or prototypes', 'Character designs', '3D models', 'None of the above'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="checkbox"
                      checked={answers.q2.includes(option)}
                      onChange={() => handleMultipleAnswer('q2', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>3. Which tools have you used before? (Select all that apply)</label>
                {['Drawing software (Krita, Photoshop, Procreate…)', 'Game engines (Unity, Unreal, Godot)', 'Animation tools (Toon Boom, Blender, RoughAnimator)', 'Coding environments', 'None'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="checkbox"
                      checked={answers.q3.includes(option)}
                      onChange={() => handleMultipleAnswer('q3', option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentSection === 2 && (
            <div className="questionnaire-section">
              <h3>Section 2 — Creative vs Technical Orientation</h3>
              
              <div className="questionnaire-question">
                <label>4. Which statement describes you best?</label>
                {['I enjoy coming up with ideas, characters, stories, visuals.', 'I enjoy building systems, logic, mechanics, tools.', 'A mix of both.'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q4"
                      value={option}
                      checked={answers.q4 === option}
                      onChange={(e) => handleSingleAnswer('q4', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>5. What do you enjoy more?</label>
                {['Creative improvisation and visual decisions', 'Step-by-step problem solving and structure', 'Both equally'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q5"
                      value={option}
                      checked={answers.q5 === option}
                      onChange={(e) => handleSingleAnswer('q5', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>6. What frustrates you the most?</label>
                {['Not being able to draw what I imagine', 'Not understanding the technical tools (coding, engines, workflows)', 'Lack of discipline / no direction', 'Nothing in particular'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q6"
                      value={option}
                      checked={answers.q6 === option}
                      onChange={(e) => handleSingleAnswer('q6', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentSection === 3 && (
            <div className="questionnaire-section">
              <h3>Section 3 — Preferences & Interests</h3>
              
              <div className="questionnaire-question">
                <label>7. What's your main reason for joining MoodyChimp?</label>
                {['Learn how to make my first game', 'Improve my animation abilities', 'Master drawing the human figure in a simpler, powerful way', 'Explore different creative fields', 'Build a long-term creative career'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q7"
                      value={option}
                      checked={answers.q7 === option}
                      onChange={(e) => handleSingleAnswer('q7', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>8. Which areas excite you the most? (Select up to 2)</label>
                {['Characters and storytelling', 'Movement, motion, and dynamics', 'Worldbuilding and mechanics', 'Design and style', 'Technical systems and structure', 'Human anatomy, accuracy, and form'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="checkbox"
                      checked={answers.q8.includes(option)}
                      onChange={() => {
                        if (answers.q8.length < 2 || answers.q8.includes(option)) {
                          handleMultipleAnswer('q8', option);
                        }
                      }}
                      disabled={!answers.q8.includes(option) && answers.q8.length >= 2}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentSection === 4 && (
            <div className="questionnaire-section">
              <h3>Section 4 — Commitment & Learning Style</h3>
              
              <div className="questionnaire-question">
                <label>9. How much time can you commit weekly?</label>
                {['1–2 hours', '3–5 hours', '6–10 hours', '10+ hours'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q9"
                      value={option}
                      checked={answers.q9 === option}
                      onChange={(e) => handleSingleAnswer('q9', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>10. What kind of learning do you prefer?</label>
                {['Hands-on exercises and small projects', 'Step-by-step guided lessons', 'Big creative challenges', 'Theory-first, then practice', 'Practice-first, minimal theory'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q10"
                      value={option}
                      checked={answers.q10 === option}
                      onChange={(e) => handleSingleAnswer('q10', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>11. How do you feel about learning complex software?</label>
                {['I love it', 'I don\'t mind it', 'I prefer simple tools', 'I avoid it unless necessary'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q11"
                      value={option}
                      checked={answers.q11 === option}
                      onChange={(e) => handleSingleAnswer('q11', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentSection === 5 && (
            <div className="questionnaire-section">
              <h3>Section 5 — Self-Assessment of Abilities</h3>
              
              <div className="questionnaire-question">
                <label>12. How comfortable are you with drawing the human figure?</label>
                {['I\'ve never seriously tried', 'I know some basics', 'I can draw basic poses', 'I understand forms and perspective', 'I\'m confident drawing people from imagination'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q12"
                      value={option}
                      checked={answers.q12 === option}
                      onChange={(e) => handleSingleAnswer('q12', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>13. How comfortable are you with animation?</label>
                {['Never tried', 'Can do simple bouncing balls or sketches', 'Can animate simple characters', 'Can animate intermediate sequences', 'Strong confidence'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q13"
                      value={option}
                      checked={answers.q13 === option}
                      onChange={(e) => handleSingleAnswer('q13', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>

              <div className="questionnaire-question">
                <label>14. How comfortable are you with game development?</label>
                {['Total beginner', 'Tried once or twice', 'Can make small prototypes', 'Understand a game engine well', 'Advanced'].map(option => (
                  <label key={option} className="questionnaire-option">
                    <input
                      type="radio"
                      name="q14"
                      value={option}
                      checked={answers.q14 === option}
                      onChange={(e) => handleSingleAnswer('q14', e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="questionnaire-footer">
          {currentSection > 1 && (
            <button className="questionnaire-btn questionnaire-btn-back" onClick={handleBack}>
              ← Back
            </button>
          )}
          {currentSection < 5 ? (
            <button 
              className="questionnaire-btn questionnaire-btn-next" 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next →
            </button>
          ) : (
            <button 
              className="questionnaire-btn questionnaire-btn-submit" 
              onClick={handleSubmit}
              disabled={!canProceed()}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;

