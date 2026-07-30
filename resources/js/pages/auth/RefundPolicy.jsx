import LegalPageLayout from '../../components/LegalPageLayout';

export default function RefundPolicy() {
    return (
        <LegalPageLayout title="No Refund Policy" active="refund">
            <section className="legal-section legal-section--highlight">
                <h2>No Refund Policy</h2>
                <p>
                    As per our company policy, once a service is purchased, it is non-refundable. No refunds will be issued
                    under any circumstances for these offerings.
                </p>
            </section>

            <section className="legal-section">
                <h2>What this means</h2>
                <ul className="legal-list">
                    <li>Completed or initiated service purchases cannot be reversed for a refund.</li>
                    <li>Chargebacks or refund requests after purchase will not be honored under this policy.</li>
                    <li>
                        If you have questions before paying, contact us using the business details below so you can make an
                        informed decision.
                    </li>
                </ul>
            </section>
        </LegalPageLayout>
    );
}
