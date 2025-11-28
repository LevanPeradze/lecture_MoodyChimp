import './QuestionnaireResult.css';

const QuestionnaireResult = ({ optimalCourse, onClose }) => {
  const getResultData = () => {
    switch (optimalCourse) {
      case 'Game Dev':
        return {
          title: 'your an NerdyChimp!',
          description: 'the questionare has determined that the optimal course for you is GameDev',
          color: '#6F7FD4' // blue
        };
      case 'Animation':
        return {
          title: 'your a GetReadyToBeASlaveChimp!',
          description: 'the questionare has determined that the optimal course for you is Animation',
          color: '#FF8C42' // orange
        };
      case 'Simplifying the human figure':
        return {
          title: 'your a BrokeChimp!',
          description: 'the questionare has determined that the optimal course for you is Simplifying The Human Figure',
          color: '#FFD700' // yellow
        };
      default:
        return {
          title: 'Thank you!',
          description: 'Your optimal course has been determined.',
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

