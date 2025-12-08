import { useState } from 'react';
import { useI18n } from './i18n/index.jsx';
import { getApiUrl } from './config';
import './Questionnaire.css';

const Questionnaire = ({ userEmail, onComplete, onClose }) => {
  const { t } = useI18n();
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
      const response = await fetch(getApiUrl('api/questionnaire'), {
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
          <h2>{t('questionnaire.title')}</h2>
          <div className="questionnaire-progress">
            {t('questionnaire.section')} {currentSection} {t('questionnaire.of')} 5
          </div>
        </div>

        <div className="questionnaire-content">
          {currentSection === 1 && (
            <div className="questionnaire-section">
              <h3>{t('questionnaire.sections.1')}</h3>
              
              <div className="questionnaire-question">
                <label>{t('questionnaire.questions.q1.label')}</label>
                {[
                  t('questionnaire.questions.q1.options.totalBeginner'),
                  t('questionnaire.questions.q1.options.beginner'),
                  t('questionnaire.questions.q1.options.intermediate'),
                  t('questionnaire.questions.q1.options.advanced')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q2.label')}</label>
                {[
                  t('questionnaire.questions.q2.options.drawings'),
                  t('questionnaire.questions.q2.options.animations'),
                  t('questionnaire.questions.q2.options.gameConcepts'),
                  t('questionnaire.questions.q2.options.characterDesigns'),
                  t('questionnaire.questions.q2.options.3dModels'),
                  t('questionnaire.questions.q2.options.none')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q3.label')}</label>
                {[
                  t('questionnaire.questions.q3.options.drawingSoftware'),
                  t('questionnaire.questions.q3.options.gameEngines'),
                  t('questionnaire.questions.q3.options.animationTools'),
                  t('questionnaire.questions.q3.options.codingEnvironments'),
                  t('questionnaire.questions.q3.options.none')
                ].map(option => (
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
              <h3>{t('questionnaire.sections.2')}</h3>
              
              <div className="questionnaire-question">
                <label>{t('questionnaire.questions.q4.label')}</label>
                {[
                  t('questionnaire.questions.q4.options.creative'),
                  t('questionnaire.questions.q4.options.technical'),
                  t('questionnaire.questions.q4.options.both')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q5.label')}</label>
                {[
                  t('questionnaire.questions.q5.options.improvisation'),
                  t('questionnaire.questions.q5.options.problemSolving'),
                  t('questionnaire.questions.q5.options.bothEqually')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q6.label')}</label>
                {[
                  t('questionnaire.questions.q6.options.drawing'),
                  t('questionnaire.questions.q6.options.technical'),
                  t('questionnaire.questions.q6.options.discipline'),
                  t('questionnaire.questions.q6.options.nothing')
                ].map(option => (
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
              <h3>{t('questionnaire.sections.3')}</h3>
              
              <div className="questionnaire-question">
                <label>{t('questionnaire.questions.q7.label')}</label>
                {[
                  t('questionnaire.questions.q7.options.game'),
                  t('questionnaire.questions.q7.options.animation'),
                  t('questionnaire.questions.q7.options.drawing'),
                  t('questionnaire.questions.q7.options.explore'),
                  t('questionnaire.questions.q7.options.career')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q8.label')}</label>
                {[
                  t('questionnaire.questions.q8.options.characters'),
                  t('questionnaire.questions.q8.options.movement'),
                  t('questionnaire.questions.q8.options.worldbuilding'),
                  t('questionnaire.questions.q8.options.design'),
                  t('questionnaire.questions.q8.options.technical'),
                  t('questionnaire.questions.q8.options.anatomy')
                ].map(option => (
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
              <h3>{t('questionnaire.sections.4')}</h3>
              
              <div className="questionnaire-question">
                <label>{t('questionnaire.questions.q9.label')}</label>
                {[
                  t('questionnaire.questions.q9.options.1to2'),
                  t('questionnaire.questions.q9.options.3to5'),
                  t('questionnaire.questions.q9.options.6to10'),
                  t('questionnaire.questions.q9.options.10plus')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q10.label')}</label>
                {[
                  t('questionnaire.questions.q10.options.handsOn'),
                  t('questionnaire.questions.q10.options.guided'),
                  t('questionnaire.questions.q10.options.challenges'),
                  t('questionnaire.questions.q10.options.theoryFirst'),
                  t('questionnaire.questions.q10.options.practiceFirst')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q11.label')}</label>
                {[
                  t('questionnaire.questions.q11.options.loveIt'),
                  t('questionnaire.questions.q11.options.dontMind'),
                  t('questionnaire.questions.q11.options.preferSimple'),
                  t('questionnaire.questions.q11.options.avoid')
                ].map(option => (
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
              <h3>{t('questionnaire.sections.5')}</h3>
              
              <div className="questionnaire-question">
                <label>{t('questionnaire.questions.q12.label')}</label>
                {[
                  t('questionnaire.questions.q12.options.neverTried'),
                  t('questionnaire.questions.q12.options.someBasics'),
                  t('questionnaire.questions.q12.options.basicPoses'),
                  t('questionnaire.questions.q12.options.forms'),
                  t('questionnaire.questions.q12.options.confident')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q13.label')}</label>
                {[
                  t('questionnaire.questions.q13.options.neverTried'),
                  t('questionnaire.questions.q13.options.simple'),
                  t('questionnaire.questions.q13.options.simpleCharacters'),
                  t('questionnaire.questions.q13.options.intermediate'),
                  t('questionnaire.questions.q13.options.strong')
                ].map(option => (
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
                <label>{t('questionnaire.questions.q14.label')}</label>
                {[
                  t('questionnaire.questions.q14.options.totalBeginner'),
                  t('questionnaire.questions.q14.options.tried'),
                  t('questionnaire.questions.q14.options.prototypes'),
                  t('questionnaire.questions.q14.options.understand'),
                  t('questionnaire.questions.q14.options.advanced')
                ].map(option => (
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
              {t('questionnaire.back')}
            </button>
          )}
          {currentSection < 5 ? (
            <button 
              className="questionnaire-btn questionnaire-btn-next" 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {t('questionnaire.next')}
            </button>
          ) : (
            <button 
              className="questionnaire-btn questionnaire-btn-submit" 
              onClick={handleSubmit}
              disabled={!canProceed()}
            >
              {t('questionnaire.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;

