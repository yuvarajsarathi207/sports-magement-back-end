export default function FormLabel({ children, required = false, icon }) {
    return (
        <span className="field-label-row">
            {icon && <span className="field-icon" aria-hidden="true">{icon}</span>}
            <span>{children}</span>
            {required && (
                <span className="required-mark" title="Required" aria-label="required">*</span>
            )}
        </span>
    );
}
