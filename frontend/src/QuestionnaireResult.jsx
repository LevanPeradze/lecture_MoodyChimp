import { useI18n } from './i18n/index.jsx';
import './QuestionnaireResult.css';

const QuestionnaireResult = ({ optimalCourse, onClose }) => {
  const { t } = useI18n();
  
  const getResultData = () => {
    switch (optimalCourse) {
      case 'Game Dev':
        return {
          title: t('questionnaire.result.gameDev.title'),
          description: t('questionnaire.result.gameDev.description'),
          color: '#6F7FD4' // blue
        };
      case 'Animation':
        return {
          title: t('questionnaire.result.animation.title'),
          description: t('questionnaire.result.animation.description'),
          color: '#FF8C42' // orange
        };
      case 'Simplifying the human figure':
        return {
          title: t('questionnaire.result.simplifying.title'),
          description: t('questionnaire.result.simplifying.description'),
          color: '#FFD700' // yellow
        };
      default:
        return {
          title: t('questionnaire.result.default.title'),
          description: t('questionnaire.result.default.description'),
          color: '#6F7FD4'
        };
    }
  };

  const resultData = getResultData();

  return (
    <div className="questionnaire-result-overlay" onClick={onClose}>
      <div className="questionnaire-result-modal" onClick={(e) => e.stopPropagation()}>
        <button className="questionnaire-result-close" onClick={onClose}>×</button>
        <h2 className="questionnaire-result-title" style={{ color: resultData.color, fontSize: '2.5rem', fontWeight: '700' }}>
          {resultData.title}
        </h2>
        <p className="questionnaire-result-description" style={{ color: resultData.color, fontSize: '1.1rem', fontWeight: '400' }}>
          {resultData.description}
        </p>
      </div>
    </div>
  );
};

export default QuestionnaireResult;

