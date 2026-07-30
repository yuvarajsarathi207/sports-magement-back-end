import LegalPageLayout from '../../components/LegalPageLayout';

export default function Terms() {
    const navigate = useNavigate();

    return (
        <LegalPageLayout title="Terms & Conditions" active="terms">
            <p className="legal-intro">
                These Terms and Conditions govern your use of this website and the purchase of products or services offered
                herein. By accessing or using this website, you agree to be bound by these terms. Please read them carefully.
            </p>

            <section className="legal-section">
                <h2>1. General Use</h2>
                <ul className="legal-list">
                    <li>
                        By using this website, you confirm that you are at least 18 years old or are using the website under
                        the supervision of a parent or legal guardian.
                    </li>
                    <li>
                        All content on this website is for informational purposes only and is subject to change without notice.
                    </li>
                </ul>
            </section>

            <section className="legal-section">
                <h2>2. User Responsibilities</h2>
                <ul className="legal-list">
                    <li>
                        Users agree not to misuse the website by knowingly introducing viruses, trojans, or other malicious
                        material.
                    </li>
                    <li>
                        You must not attempt to gain unauthorized access to the server, database, or any part of the site.
                    </li>
                </ul>
            </section>

            <section className="legal-section">
                <h2>3. Product &amp; Service Descriptions</h2>
                <p>
                    All efforts are made to ensure accuracy in product descriptions, images, pricing, and availability.
                    However, we do not warrant that product descriptions or other content are complete, current, or error-free.
                </p>
            </section>

            <section className="legal-section">
                <h2>4. Order Acceptance &amp; Cancellation</h2>
                <p>
                    Placing an order on this website does not constitute a confirmed order. We reserve the right to refuse or
                    cancel any order for reasons including but not limited to product availability, pricing errors, or suspected
                    fraud.
                </p>
            </section>

            <section className="legal-section">
                <h2>5. Pricing and Payment</h2>
                <ul className="legal-list">
                    <li>
                        All prices are displayed in INR or the local currency and are inclusive or exclusive of taxes as
                        indicated.
                    </li>
                    <li>
                        Payments must be made through secure and approved payment gateways. The website is not liable for any
                        payment gateway errors.
                    </li>
                </ul>
            </section>

            <section className="legal-section">
                <h2>6. Intellectual Property</h2>
                <p>
                    All text, graphics, logos, images, and other materials on this website are the intellectual property of their
                    respective owners and protected by copyright and trademark laws. Unauthorized use or duplication of any
                    materials is prohibited.
                </p>
            </section>

            <section className="legal-section">
                <h2>7. Limitation of Liability</h2>
                <p>
                    We are not responsible for any indirect or consequential damages that may arise from the use or inability to
                    use the website or the products purchased through it. Liability is limited to the value of the product
                    purchased, if applicable.
                </p>
            </section>

            <section className="legal-section">
                <h2>8. Modifications to Terms</h2>
                <p>
                    These terms may be revised at any time without prior notice. Continued use of the site after changes implies
                    acceptance of those changes.
                </p>
            </section>

            <section className="legal-section">
                <h2>9. Governing Law</h2>
                <p>These terms shall be governed by and construed in accordance with the laws of India.</p>
            </section>
        </LegalPageLayout>
    );
}
