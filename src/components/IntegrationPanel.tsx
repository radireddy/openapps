import React, { useState } from 'react';
import { IntegrationSettings } from '../types';

interface IntegrationPanelProps {
    integrationSettings?: IntegrationSettings;
    onUpdate: (settings: IntegrationSettings) => void;
}

export const IntegrationPanel: React.FC<IntegrationPanelProps> = ({ integrationSettings, onUpdate }) => {
    const [localSettings, setLocalSettings] = useState<IntegrationSettings>(
        integrationSettings || {
            accountName: '',
            tenantName: '',
            clientId: '',
            scope: '',
        }
    );

    const handleChange = (field: keyof IntegrationSettings, value: string) => {
        const updatedSettings = { ...localSettings, [field]: value };
        setLocalSettings(updatedSettings);
        onUpdate(updatedSettings);
    };

    return (
        <div className="h-full flex flex-col bg-ed-bg">
            <div className="p-4 border-b border-ed-border">
                <h2 className="text-lg font-semibold text-ed-text">Integration Settings</h2>
                <p className="text-xs text-ed-text-secondary mt-1">Configure external service integration</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-ed-text-secondary mb-1">
                        Account Name
                    </label>
                    <input
                        type="text"
                        value={localSettings.accountName}
                        onChange={(e) => handleChange('accountName', e.target.value)}
                        className="w-full px-3 py-2 border border-ed-border rounded-md bg-ed-bg-secondary text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                        placeholder="Enter account name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-ed-text-secondary mb-1">
                        Tenant Name
                    </label>
                    <input
                        type="text"
                        value={localSettings.tenantName}
                        onChange={(e) => handleChange('tenantName', e.target.value)}
                        className="w-full px-3 py-2 border border-ed-border rounded-md bg-ed-bg-secondary text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                        placeholder="Enter tenant name"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-ed-text-secondary mb-1">
                        Client ID
                    </label>
                    <input
                        type="text"
                        value={localSettings.clientId}
                        onChange={(e) => handleChange('clientId', e.target.value)}
                        className="w-full px-3 py-2 border border-ed-border rounded-md bg-ed-bg-secondary text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                        placeholder="Enter client ID"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-ed-text-secondary mb-1">
                        Scope
                    </label>
                    <input
                        type="text"
                        value={localSettings.scope}
                        onChange={(e) => handleChange('scope', e.target.value)}
                        className="w-full px-3 py-2 border border-ed-border rounded-md bg-ed-bg-secondary text-ed-text focus:outline-none focus:ring-2 focus:ring-ed-accent/20 focus:border-ed-border-focus"
                        placeholder="Enter scope"
                    />
                </div>
            </div>
        </div>
    );
};
