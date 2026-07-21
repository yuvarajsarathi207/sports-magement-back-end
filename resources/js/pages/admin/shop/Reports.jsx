import { useEffect, useState } from 'react';
import api from '../../../api/client';

export default function AdminReports() {
    const [type, setType] = useState('sales');
    const [report, setReport] = useState(null);

    useEffect(() => {
        api.get('/admin/shop/reports', { params: { type } }).then((res) => setReport(res.data));
    }, [type]);

    return (
        <div className="page">
            <h2 className="section-title">Reports</h2>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="sales">Sales</option>
                <option value="revenue">Revenue</option>
                <option value="products">Products</option>
                <option value="users">Users</option>
            </select>
            <pre className="report-pre">{report ? JSON.stringify(report, null, 2) : 'Loading...'}</pre>
        </div>
    );
}
