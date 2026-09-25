import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Alert from '../components/Alert';
import LoaderScreen from '../components/LoaderScreen';
import { useAuth } from '../context/AuthContext';

function turfBookingPath(user, bookingId) {
    if (!bookingId) {
        if (user?.role === 'organizer') return '/organizer/turf/bookings';
        if (user?.role === 'turf_owner') return '/turf/bookings';
        return '/turf/bookings';
    }
    if (user?.role === 'organizer') return `/organizer/turf/bookings/${bookingId}`;
    if (user?.role === 'turf_owner') return `/turf/bookings/${bookingId}`;
    return `/turf/bookings/${bookingId}`;
}

export default function PaymentReturn() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const merchantOrderId = searchParams.get('merchantOrderId') || searchParams.get('merchant_order_id');
    const typeParam = searchParams.get('type');
    const bookingIdParam = searchParams.get('bookingId') || searchParams.get('booking_id');
    const [payment, setPayment] = useState(null);
    const [paymentType, setPaymentType] = useState(typeParam || null);
    const [booking, setBooking] = useState(null);
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
                if (!cancelled) {
                    setPayment(data.payment);
                    setPaymentType(data.type || typeParam || null);
                    if (data.booking) setBooking(data.booking);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || 'Could not confirm payment status.');
                    if (err.response?.data?.payment) {
                        setPayment(err.response.data.payment);
                    }
                    if (err.response?.data?.type) {
                        setPaymentType(err.response.data.type);
                    }
                    if (err.response?.data?.booking) {
                        setBooking(err.response.data.booking);
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
    }, [merchantOrderId, typeParam]);

    if (loading) return <LoaderScreen message="Confirming payment..." fullScreen />;

    const status = payment?.status || 'unknown';
    const isTurf = paymentType === 'turf'
        || typeParam === 'turf'
        || Boolean(bookingIdParam)
        || Boolean(booking?.id)
        || (payment && !payment.order_id && !payment.tournament_id && (payment.module === 'turf' || payment.payable_type?.includes?.('Booking')));

    const isCommerce = !isTurf && (Boolean(payment?.order_id) || ['SUCCESS', 'PENDING', 'FAILED', 'INITIATED'].includes(status));
    const isSuccess = status === 'completed' || status === 'SUCCESS' || status === 'paid';
    const isFailed = status === 'failed' || status === 'FAILED';

    const goHome = () => {
        if (user?.role === 'organizer') navigate('/organizer');
        else if (user?.role === 'admin') navigate('/admin');
        else if (user?.role === 'turf_owner') navigate('/turf/owner');
        else navigate('/');
    };

    const goDetail = () => {
        if (isTurf) {
            const bookingId = booking?.id || bookingIdParam || payment?.payable_id;
            navigate(turfBookingPath(user, bookingId));
            return;
        }
        if (isCommerce && payment?.order_id) {
            if (user?.role === 'organizer') navigate(`/organizer/shop/orders/${payment.order_id}`);
            else navigate(`/shop/orders/${payment.order_id}`);
            return;
        }
        const tournamentId = payment?.tournament_id;
        if (!tournamentId) {
            goHome();
            return;
        }
        if (user?.role === 'organizer') navigate(`/organizer/tournaments/${tournamentId}`);
        else navigate(`/tournaments/${tournamentId}`);
    };

    const detailLabel = isTurf ? 'View booking' : (isCommerce ? 'View order' : 'Back to tournament');

    return (
        <div className="page" style={{ maxWidth: 480, margin: '2rem auto' }}>
            <h2 className="section-title">Payment status</h2>
            <Alert message={error} />

            {isSuccess && <Alert type="success" message="Payment completed successfully." />}
            {isFailed && (
                <Alert
                    message={
                        isTurf
                            ? 'Payment failed. You can retry from your booking or book again after the hold expires.'
                            : (isCommerce
                                ? 'Payment failed. You can retry from your orders.'
                                : 'Payment failed. You can try again from the tournament page.')
                    }
                />
            )}
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
                        <span>{isTurf ? 'turf' : (isCommerce ? 'commerce' : (payment.type || paymentType || 'tournament'))}</span>
                    </div>
                </div>
            )}

            <div className="action-stack" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-primary btn-block" onClick={goDetail}>
                    {detailLabel}
                </button>
                <button type="button" className="btn btn-outline btn-block" onClick={goHome}>
                    Go home
                </button>
            </div>
        </div>
    );
}
