import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Spinner } from '../../components/ui';
import { ApiRequestError, apiRequest } from '../../lib/api';
import { t, translatedError } from '../../i18n/en';

export function AnalyzingPage() {
  const [failed, setFailed] = useState(false);
  const [failureMessage, setFailureMessage] = useState(t('analyzing.error'));
  const [retry, setRetry] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    setFailed(false);
    setFailureMessage(t('analyzing.error'));
    void apiRequest('/fitness/assessment', { method: 'POST' }).then(() => apiRequest('/ai/workout/generate', { method: 'POST' })).then(() => {
      if (active) navigate('/workout', { replace: true });
    }).catch((error: unknown) => {
      if (active) {
        setFailureMessage(error instanceof ApiRequestError ? translatedError(error.code, t('analyzing.error')) : t('analyzing.error'));
        setFailed(true);
      }
    });
    return () => { active = false; };
  }, [navigate, retry]);
  return <div className="page-content analyzing-page"><Card><Spinner /><h1>{t('analyzing.title')}</h1><p className="muted">{t('analyzing.description')}</p><ol className="analysis-steps"><li>{t('analyzing.profile')}</li><li>{t('analyzing.targets')}</li><li>{t('analyzing.exercises')}</li><li>{t('analyzing.workout')}</li></ol>{failed && <div className="alert analysis-error" role="alert"><span>! {failureMessage}</span><Button onClick={() => setRetry((current) => current + 1)}>{t('analyzing.retry')}</Button><Button variant="secondary" onClick={() => navigate('/dashboard', { replace: true })}>{t('analyzing.continueWithoutPlan')}</Button></div>}</Card></div>;
}
