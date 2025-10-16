import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FormField, FormFieldType, FormConfiguration } from '@/types/formBuilder';
import type { SLARule } from '@/types/sla';
import type { BrandingConfiguration } from '@/types/branding';
import { DEFAULT_BRANDING } from '@/types/branding';
import FieldPalette, { FIELD_TYPES } from '@/components/customize/FieldPalette';
import FormCanvas from '@/components/customize/FormCanvas';
import FieldConfigurator from '@/components/customize/FieldConfigurator';
import FormPreview from '@/components/customize/FormPreview';
import SLAList from '@/components/sla/SLAList';
import SLAForm from '@/components/sla/SLAForm';
import BrandingCustomizer from '@/components/branding/BrandingCustomizer';
import BrandingPreview from '@/components/branding/BrandingPreview';
import { Save, Eye, EyeOff, RotateCcw, Plus } from 'lucide-react';
import { mergeWithDefaults } from '@/utils/defaultFormConfig';

const STORAGE_KEY = 'itsm-form-configuration';
const SLA_STORAGE_KEY = 'itsm-sla-configuration';
const BRANDING_STORAGE_KEY = 'itsm-branding-configuration';
const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function Customize() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // SLA state
  const [slaRules, setSlaRules] = useState<SLARule[]>([]);
  const [showSlaForm, setShowSlaForm] = useState(false);
  const [editingSlaRule, setEditingSlaRule] = useState<SLARule | null>(null);
  const [slaSaveMessage, setSlaSaveMessage] = useState<string>('');

  // Branding state
  const [branding, setBranding] = useState<BrandingConfiguration>(DEFAULT_BRANDING);
  const [brandingPreviewMode, setBrandingPreviewMode] = useState<'login' | 'portal'>('login');
  const [brandingSaveMessage, setBrandingSaveMessage] = useState<string>('');

  // Load form configuration from API (fallback to localStorage) on mount
  useEffect(() => {
    const loadFormConfig = async () => {
      let loadedFields: FormField[] = [];

      try {
        // Try loading from API first
        const response = await fetch(`${API_BASE}/api/config/form`);
        const data = await response.json();

        if (data.success && data.config.fields) {
          loadedFields = data.config.fields;
        }
      } catch (error) {
        console.error('Failed to load form configuration from API:', error);

        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const config: FormConfiguration = JSON.parse(saved);
            loadedFields = config.fields || [];
          } catch (parseError) {
            console.error('Failed to load form configuration from localStorage:', parseError);
          }
        }
      }

      // Merge loaded fields with default system fields
      const mergedFields = mergeWithDefaults(loadedFields);
      setFields(mergedFields);

      // Save merged configuration to both API and localStorage
      const mergedConfig: FormConfiguration = {
        id: 'default',
        name: 'Ticket Creation Form',
        fields: mergedFields,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Cache in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedConfig));

      // If we added default fields, save to API too
      if (loadedFields.length !== mergedFields.length) {
        try {
          await fetch(`${API_BASE}/api/config/form`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: mergedConfig.name,
              fields: mergedConfig.fields,
            }),
          });
        } catch (saveError) {
          console.error('Failed to save default fields to API:', saveError);
        }
      }
    };

    loadFormConfig();
  }, []);

  // Load SLA configuration from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SLA_STORAGE_KEY);
    if (saved) {
      try {
        const rules: SLARule[] = JSON.parse(saved);
        setSlaRules(rules);
      } catch (error) {
        console.error('Failed to load SLA configuration:', error);
      }
    }
  }, []);

  // Load branding configuration from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (saved) {
      try {
        const config: BrandingConfiguration = JSON.parse(saved);
        setBranding(config);
      } catch (error) {
        console.error('Failed to load branding configuration:', error);
      }
    }
  }, []);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  const handleAddField = (fieldType: FormFieldType) => {
    const fieldTemplate = FIELD_TYPES.find((ft) => ft.type === fieldType);
    if (!fieldTemplate) return;

    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      label: fieldTemplate.defaultConfig.label || 'New Field',
      placeholder: fieldTemplate.defaultConfig.placeholder,
      required: fieldTemplate.defaultConfig.required || false,
      options: fieldTemplate.defaultConfig.options,
      defaultValue: fieldTemplate.defaultConfig.defaultValue,
      order: fields.length,
    };

    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const handleFieldUpdate = (updatedField: FormField) => {
    setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
  };

  const handleSaveConfiguration = async () => {
    const config: FormConfiguration = {
      id: 'default',
      name: 'Ticket Creation Form',
      fields,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to localStorage as fallback
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    try {
      // Save to API
      const response = await fetch(`${API_BASE}/api/config/form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          fields: config.fields,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveMessage('Form configuration saved successfully!');
      } else {
        setSaveMessage('Saved locally (API error: ' + data.error + ')');
      }
    } catch (error) {
      console.error('Failed to save to API:', error);
      setSaveMessage('Saved locally (server unavailable)');
    }

    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleResetForm = () => {
    if (confirm('Are you sure you want to reset the form? This will clear all fields.')) {
      setFields([]);
      setSelectedFieldId(null);
      localStorage.removeItem(STORAGE_KEY);
      setSaveMessage('Form reset successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // SLA handlers
  const handleSaveSla = (ruleData: Omit<SLARule, 'id' | 'createdAt' | 'updatedAt'>) => {
    let updatedRules: SLARule[];

    if (editingSlaRule) {
      // Update existing rule
      updatedRules = slaRules.map((rule) =>
        rule.id === editingSlaRule.id
          ? {
              ...ruleData,
              id: rule.id,
              createdAt: rule.createdAt,
              updatedAt: new Date(),
            }
          : rule
      );
      setSlaSaveMessage('SLA rule updated successfully!');
    } else {
      // Create new rule
      const newRule: SLARule = {
        ...ruleData,
        id: `sla-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      updatedRules = [...slaRules, newRule];
      setSlaSaveMessage('SLA rule created successfully!');
    }

    setSlaRules(updatedRules);
    localStorage.setItem(SLA_STORAGE_KEY, JSON.stringify(updatedRules));
    setShowSlaForm(false);
    setEditingSlaRule(null);
    setTimeout(() => setSlaSaveMessage(''), 3000);
  };

  const handleEditSla = (rule: SLARule) => {
    setEditingSlaRule(rule);
    setShowSlaForm(true);
  };

  const handleDeleteSla = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this SLA rule?')) {
      const updatedRules = slaRules.filter((rule) => rule.id !== ruleId);
      setSlaRules(updatedRules);
      localStorage.setItem(SLA_STORAGE_KEY, JSON.stringify(updatedRules));
      setSlaSaveMessage('SLA rule deleted successfully!');
      setTimeout(() => setSlaSaveMessage(''), 3000);
    }
  };

  const handleToggleSlaEnabled = (ruleId: string) => {
    const updatedRules = slaRules.map((rule) =>
      rule.id === ruleId
        ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
        : rule
    );
    setSlaRules(updatedRules);
    localStorage.setItem(SLA_STORAGE_KEY, JSON.stringify(updatedRules));
  };

  const handleCancelSlaForm = () => {
    setShowSlaForm(false);
    setEditingSlaRule(null);
  };

  // Branding handlers
  const handleUpdateBranding = (updatedBranding: BrandingConfiguration) => {
    setBranding(updatedBranding);
  };

  const handleSaveBranding = () => {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
    setBrandingSaveMessage('Branding saved successfully!');
    setTimeout(() => setBrandingSaveMessage(''), 3000);
  };

  const handleResetBranding = () => {
    if (confirm('Are you sure you want to reset branding to defaults?')) {
      setBranding(DEFAULT_BRANDING);
      localStorage.removeItem(BRANDING_STORAGE_KEY);
      setBrandingSaveMessage('Branding reset to defaults!');
      setTimeout(() => setBrandingSaveMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <Tabs defaultValue="form-builder" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="form-builder">Ticket Form Builder</TabsTrigger>
          <TabsTrigger value="sla">SLA Configuration</TabsTrigger>
          <TabsTrigger value="branding">Portal Branding</TabsTrigger>
        </TabsList>

        {/* Ticket Form Builder Tab */}
        <TabsContent value="form-builder" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ticket Form Builder</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Drag and drop fields to customize the ticket creation form
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {saveMessage && (
                    <span className="text-sm text-green-600 mr-2">{saveMessage}</span>
                  )}
                  <Button variant="outline" size="sm" onClick={handleResetForm}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Show Preview
                      </>
                    )}
                  </Button>
                  <Button size="sm" onClick={handleSaveConfiguration}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <FormPreview fields={fields} />
              ) : (
                <div className="grid grid-cols-12 gap-4">
                  {/* Field Palette - Left Sidebar */}
                  <div className="col-span-3">
                    <FieldPalette onFieldTypeSelect={handleAddField} />
                  </div>

                  {/* Form Canvas - Center */}
                  <div className="col-span-6">
                    <FormCanvas
                      fields={fields}
                      selectedFieldId={selectedFieldId}
                      onFieldsChange={setFields}
                      onFieldSelect={setSelectedFieldId}
                      onAddField={handleAddField}
                    />
                  </div>

                  {/* Field Configurator - Right Sidebar */}
                  <div className="col-span-3">
                    <FieldConfigurator
                      field={selectedField}
                      onFieldUpdate={handleFieldUpdate}
                      onClose={() => setSelectedFieldId(null)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Configuration Tab */}
        <TabsContent value="sla" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SLA Configuration</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure service level agreements and response time targets
                  </p>
                </div>
                {!showSlaForm && (
                  <div className="flex items-center gap-2">
                    {slaSaveMessage && (
                      <span className="text-sm text-green-600 mr-2">{slaSaveMessage}</span>
                    )}
                    <Button size="sm" onClick={() => setShowSlaForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Rule
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showSlaForm ? (
                <SLAForm
                  rule={editingSlaRule}
                  onSave={handleSaveSla}
                  onCancel={handleCancelSlaForm}
                />
              ) : (
                <SLAList
                  rules={slaRules}
                  onEdit={handleEditSla}
                  onDelete={handleDeleteSla}
                  onToggleEnabled={handleToggleSlaEnabled}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portal Branding Tab */}
        <TabsContent value="branding" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Portal Branding</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize the look and feel of your user portal and authentication pages
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {brandingSaveMessage && (
                    <span className="text-sm text-green-600 mr-2">{brandingSaveMessage}</span>
                  )}
                  <Button variant="outline" size="sm" onClick={handleResetBranding}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleSaveBranding}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Branding
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Preview Mode Toggle */}
                <div className="flex items-center justify-center gap-2 border-b pb-4">
                  <Button
                    variant={brandingPreviewMode === 'login' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBrandingPreviewMode('login')}
                  >
                    Login Preview
                  </Button>
                  <Button
                    variant={brandingPreviewMode === 'portal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBrandingPreviewMode('portal')}
                  >
                    Portal Preview
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Left: Customizer */}
                  <div>
                    <BrandingCustomizer
                      branding={branding}
                      onUpdate={handleUpdateBranding}
                    />
                  </div>

                  {/* Right: Preview */}
                  <div className="lg:sticky lg:top-6 lg:self-start">
                    <BrandingPreview
                      branding={branding}
                      previewMode={brandingPreviewMode}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
