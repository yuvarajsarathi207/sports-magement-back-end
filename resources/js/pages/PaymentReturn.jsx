import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Alert from '../components/Alert';
import LoaderScreen from '../components/LoaderScreen';
import { useAuth } from '../context/AuthContext';

export default function PaymentReturn() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const merchantOrderId = searchParams.get('merchantOrderId') || searchParams.get('merchant_order_id');
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!merchantOrderId) {
            setError('Missing payment reference.');
            setLoading(false);
            return;
        }

        let cancelled = false;
        const confirm = async () => {
            try {
                const { data } = await api.post(`/payments/${encodeURIComponent(merchantOrderId)}/status`);
                if (!cancelled) setPayment(data.payment);
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || 'Could not confirm payment status.');
                    if (err.response?.data?.payment) {
                        setPayment(err.response.data.payment);
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        confirm();
        return () => {
            cancelled = true;
        };
    }, [merchantOrderId]);

    if (loading) return <LoaderScreen message="Confirming payment..." fullScreen />;

    const status = payment?.status || 'unknown';
    const isSuccess = status === 'completed';
    const isFailed = status === 'failed';

    const goHome = () => {
        if (user?.role === 'organizer') navigate('/organizer');
        else if (user?.role === 'admin') navigate('/admin');
        else navigate('/');
    };

    const goDetail = () => {
        const tournamentId = payment?.tournament_id;
        if (!tournamentId) {
            goHome();
            return;
        }
        if (user?.role === 'organizer') navigate(`/organizer/tournaments/${tournamentId}`);
        else navigate(`/tournaments/${tournamentId}`);
    };

    return (
        <div className="page" style={{ maxWidth: 480, margin: '2rem auto' }}>
            <h2 className="section-title">Payment status</h2>
            <Alert message={error} />

            {isSuccess && <Alert type="success" message="Payment completed successfully." />}
            {isFailed && <Alert message="Payment failed. You can try again from the tournament page." />}
            {!isSuccess && !isFailed && payment && (
                <Alert type="success" message="Payment is still pending. Refresh in a moment if needed." />
            )}

            {payment && (
                <div className="detail-grid" style={{ marginTop: '1rem' }}>
                    <div className="detail-item">
                        <span className="detail-label">Amount</span>
                        <span>₹{payment.amount}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Status</span>
                        <span>{status}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Order ID</span>
                        <span>{payment.merchant_order_id || '—'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Type</span>
                        <span>{payment.type}</span>
                    </div>
                </div>
            )}

            <div className="action-stack" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-primary btn-block" onClick={goDetail}>
                    Back to tournament
                </button>
                <button type="button" className="btn btn-outline btn-block" onClick={goHome}>
                    Go home
                </button>
            </div>
        </div>
    );
}
