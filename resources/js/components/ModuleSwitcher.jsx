import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModules } from '../context/ModuleContext';
import { useAuth } from '../context/AuthContext';

const ICONS = {
    trophy: '🏆',
    cart: '🛒',
    stadium: '🏟️',
};

export default function ModuleSwitcher() {
    const { modules, currentModule, setCurrentModule, homeForModule } = useModules();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const current = modules.find((m) => m.code === currentModule) || modules[0];

    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    if (!modules.length) return null;

    const switchTo = (mod) => {
        setCurrentModule(mod.code);
        setOpen(false);
        navigate(homeForModule(mod.code, user?.role));
    };

    return (
        <div className="module-switcher" ref={ref}>
            <button
                type="button"
                className="module-switcher-btn"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span>{ICONS[current?.icon] || '📦'}</span>
                <span>{current?.name || 'Module'}</span>
                <span aria-hidden="true">▼</span>
            </button>
            {open && (
                <ul className="module-switcher-menu" role="listbox">
                    {modules.map((mod) => (
                        <li key={mod.code}>
                            <button
                                type="button"
                                className={mod.code === currentModule ? 'active' : ''}
                                onClick={() => switchTo(mod)}
                            >
                                <span>{ICONS[mod.icon] || '📦'}</span>
                                <span>{mod.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
