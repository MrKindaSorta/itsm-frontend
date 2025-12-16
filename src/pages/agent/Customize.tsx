import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FormField, FormFieldType, FormConfiguration } from '@/types/formBuilder';
import type { SLARule } from '@/types/sla';
import type { BrandingConfiguration } from '@/types/branding';
import { DEFAULT_BRANDING } from '@/types/branding';
import { useBranding } from '@/contexts/BrandingContext';
import FieldPalette, { FIELD_TYPES } from '@/components/customize/FieldPalette';
import LiveFormPreview from '@/components/customize/LiveFormPreview';
import FieldPropertiesDrawer from '@/components/customize/FieldPropertiesDrawer';
import FormBuilderLayout from '@/components/customize/FormBuilderLayout';
import FormBuilderHeader from '@/components/customize/FormBuilderHeader';
import SLAList from '@/components/sla/SLAList';
import SLAForm from '@/components/sla/SLAForm';
import BrandingCustomizer from '@/components/branding/BrandingCustomizer';
import BrandingPreview from '@/components/branding/BrandingPreview';
import { Plus, Save, RotateCcw } from 'lucide-react';
import { mergeWithDefaults } from '@/utils/defaultFormConfig';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const STORAGE_KEY = 'itsm-form-configuration';
const BRANDING_STORAGE_KEY = 'itsm-branding-configuration';
const API_BASE = 'https://itsm-backend.joshua-r-klimek.workers.dev';

export default function Customize() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showConditionalIndicators, setShowConditionalIndicators] = useState(true);
  const [savedFieldsSnapshot, setSavedFieldsSnapshot] = useState<string>('');

  // SLA state
  const [slaRules, setSlaRules] = useState<SLARule[]>([]);
  const [showSlaForm, setShowSlaForm] = useState(false);
  const [editingSlaRule, setEditingSlaRule] = useState<SLARule | null>(null);
  const [slaSaveMessage, setSlaSaveMessage] = useState<string>('');

  // Branding state from context
  const { branding: contextBranding, updateBranding: updateContextBranding } = useBranding();
  const [localBranding, setLocalBranding] = useState<BrandingConfiguration>(contextBranding);
  const [brandingPreviewMode, setBrandingPreviewMode] = useState<'login' | 'portal'>('login');
  const [brandingPreviewTheme, setBrandingPreviewTheme] = useState<'light' | 'dark'>('light');
  const [brandingSaveMessage, setBrandingSaveMessage] = useState<string>('');

  // Compute if there are unsaved changes by comparing current fields with saved snapshot
  const hasUnsavedChanges = useMemo(() => {
    const currentSnapshot = JSON.stringify(fields);
    return currentSnapshot !== savedFieldsSnapshot;
  }, [fields, savedFieldsSnapshot]);

  // Load form configuration from API (fallback to localStorage) on mount
  useEffect(() => {
    const loadFormConfig = async () => {
      let loadedFields: FormField[] = [];

      try {
        // Try loading from API first
        const response = await fetchWithAuth(`${API_BASE}/api/config/form`);
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

      // Snapshot the loaded fields for change detection
      setSavedFieldsSnapshot(JSON.stringify(mergedFields));

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
          await fetchWithAuth(`${API_BASE}/api/config/form`, {
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

  // Load SLA configuration from API on mount
  useEffect(() => {
    const loadSLAConfig = async () => {
      try {
        // Try loading from API first
        const response = await fetchWithAuth(`${API_BASE}/api/sla/rules`);
        const data = await response.json();

        if (data.success && data.rules) {
          // Transform API dates to Date objects
          const rules = data.rules.map((rule: any) => ({
            ...rule,
            createdAt: new Date(rule.createdAt),
            updatedAt: new Date(rule.updatedAt),
          }));
          setSlaRules(rules);
        }
      } catch (error) {
        console.error('Failed to load SLA configuration from API:', error);
      }
    };

    loadSLAConfig();
  }, []);

  // Sync local branding state with context when context updates
  useEffect(() => {
    setLocalBranding(contextBranding);
  }, [contextBranding]);

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  const handleAddField = (fieldType: FormFieldType, insertAtIndex?: number) => {
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
      order: 0, // Will be set below
    };

    // Insert at specific index or append to end
    let updatedFields: FormField[];
    if (insertAtIndex !== undefined) {
      // Insert at the specified index
      updatedFields = [
        ...fields.slice(0, insertAtIndex),
        newField,
        ...fields.slice(insertAtIndex),
      ];
    } else {
      // Append to end
      updatedFields = [...fields, newField];
    }

    // Recalculate order properties for all fields
    updatedFields = updatedFields.map((field, idx) => ({
      ...field,
      order: idx,
    }));

    setFields(updatedFields);
    setSelectedFieldId(newField.id);
  };

  const handleFieldUpdate = (updatedField: FormField) => {
    setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
  };

  const handleFieldSettingsClick = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    // Don't clear selectedFieldId immediately to allow drawer animation to complete
    setTimeout(() => setSelectedFieldId(null), 300);
  };

  const handleFieldDelete = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    // Check if field is non-deletable system field
    if (field.deletable === false) {
      alert('This system field cannot be deleted');
      return;
    }

    // Check if field has conditional children
    const childFields = fields.filter(
      (f) => f.conditionalLogic?.parentFieldId === fieldId
    );

    if (childFields.length > 0) {
      // Show custom confirmation dialog
      const shouldDeleteChildren = window.confirm(
        `This field has ${childFields.length} conditional child field(s).\n\n` +
        `Click OK to delete all children too, or Cancel to keep children as regular fields.`
      );

      if (shouldDeleteChildren) {
        // Delete parent + all descendants recursively
        const toDelete = new Set([fieldId]);
        const findDescendants = (parentId: string) => {
          fields.forEach((f) => {
            if (f.conditionalLogic?.parentFieldId === parentId) {
              toDelete.add(f.id);
              findDescendants(f.id); // Recursive
            }
          });
        };
        findDescendants(fieldId);

        setFields((prev) => prev.filter((f) => !toDelete.has(f.id)));
      } else {
        // Orphan children (remove parentFieldId, disable conditional logic)
        setFields((prev) =>
          prev
            .map((f) => {
              if (f.conditionalLogic?.parentFieldId === fieldId) {
                return {
                  ...f,
                  conditionalLogic: {
                    ...f.conditionalLogic,
                    enabled: false,
                    parentFieldId: undefined,
                  },
                };
              }
              return f;
            })
            .filter((f) => f.id !== fieldId)
        );
      }
    } else {
      // No children, simple delete
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
    }

    // Close drawer if the deleted field was selected
    if (selectedFieldId === fieldId) {
      setIsDrawerOpen(false);
      setSelectedFieldId(null);
    }
  };

  // Note: handleCreateChildField is kept for potential future conditional logic features
  // but is not currently used in the new LiveFormPreview design
  // const handleCreateChildField = (childField: Partial<FormField>, parentFieldId: string) => { ... }

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
      const response = await fetchWithAuth(`${API_BASE}/api/config/form`, {
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
        // Update snapshot after successful save
        setSavedFieldsSnapshot(JSON.stringify(fields));
      }
    } catch (error) {
      console.error('Failed to save to API:', error);
    }
  };

  const handleResetForm = () => {
    if (confirm('Are you sure you want to reset the form? This will remove all custom fields and restore defaults.')) {
      // Reset to default system fields instead of clearing completely
      const defaultFields = mergeWithDefaults([]);
      setFields(defaultFields);
      setSelectedFieldId(null);

      // Save default configuration to localStorage
      const defaultConfig: FormConfiguration = {
        id: 'default',
        name: 'Ticket Creation Form',
        fields: defaultFields,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));

      // Update snapshot to mark as saved
      setSavedFieldsSnapshot(JSON.stringify(defaultFields));
    }
  };

  // SLA handlers
  const handleSaveSla = async (ruleData: Omit<SLARule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingSlaRule) {
        // Update existing rule via API
        const response = await fetchWithAuth(`${API_BASE}/api/sla/rules/${editingSlaRule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleData),
        });

        const data = await response.json();
        if (data.success) {
          // Update local state
          const updatedRules = slaRules.map((rule) =>
            rule.id === editingSlaRule.id
              ? {
                  ...ruleData,
                  id: rule.id,
                  createdAt: new Date(data.rule.createdAt),
                  updatedAt: new Date(data.rule.updatedAt),
                }
              : rule
          );
          setSlaRules(updatedRules);
          setSlaSaveMessage('SLA rule updated successfully!');
        } else {
          setSlaSaveMessage('Failed to update SLA rule');
        }
      } else {
        // Create new rule via API
        const response = await fetchWithAuth(`${API_BASE}/api/sla/rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ruleData),
        });

        const data = await response.json();
        if (data.success) {
          const newRule: SLARule = {
            ...ruleData,
            id: data.rule.id,
            createdAt: new Date(data.rule.created_at),
            updatedAt: new Date(data.rule.updated_at),
          };
          setSlaRules([...slaRules, newRule]);
          setSlaSaveMessage('SLA rule created successfully!');
        } else {
          setSlaSaveMessage('Failed to create SLA rule');
        }
      }

      setShowSlaForm(false);
      setEditingSlaRule(null);
      setTimeout(() => setSlaSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save SLA rule:', error);
      setSlaSaveMessage('Error saving SLA rule');
      setTimeout(() => setSlaSaveMessage(''), 3000);
    }
  };

  const handleEditSla = (rule: SLARule) => {
    setEditingSlaRule(rule);
    setShowSlaForm(true);
  };

  const handleDeleteSla = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this SLA rule?')) {
      try {
        const response = await fetchWithAuth(`${API_BASE}/api/sla/rules/${ruleId}`, {
          method: 'DELETE',
        });

        const data = await response.json();
        if (data.success) {
          const updatedRules = slaRules.filter((rule) => rule.id !== ruleId);
          setSlaRules(updatedRules);
          setSlaSaveMessage('SLA rule deleted successfully!');
        } else {
          setSlaSaveMessage('Failed to delete SLA rule');
        }
        setTimeout(() => setSlaSaveMessage(''), 3000);
      } catch (error) {
        console.error('Failed to delete SLA rule:', error);
        setSlaSaveMessage('Error deleting SLA rule');
        setTimeout(() => setSlaSaveMessage(''), 3000);
      }
    }
  };

  const handleToggleSlaEnabled = async (ruleId: string) => {
    try {
      const rule = slaRules.find((r) => r.id === ruleId);
      if (!rule) return;

      const response = await fetchWithAuth(`${API_BASE}/api/sla/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });

      const data = await response.json();
      if (data.success) {
        const updatedRules = slaRules.map((r) =>
          r.id === ruleId
            ? { ...r, enabled: !r.enabled, updatedAt: new Date() }
            : r
        );
        setSlaRules(updatedRules);
      }
    } catch (error) {
      console.error('Failed to toggle SLA rule:', error);
    }
  };

  const handleCancelSlaForm = () => {
    setShowSlaForm(false);
    setEditingSlaRule(null);
  };

  // Branding handlers
  const handleUpdateBranding = (updatedBranding: BrandingConfiguration) => {
    setLocalBranding(updatedBranding);
  };

  const handleSaveBranding = async () => {
    try {
      // Save to API first
      const response = await fetchWithAuth(`${API_BASE}/api/config/branding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: localBranding.name,
          logo: localBranding.logo,
          logoSmall: localBranding.logoSmall,
          favicon: localBranding.favicon,
          colors: localBranding.colors,
          typography: localBranding.typography,
          content: localBranding.content,
          portalSettings: localBranding.portalSettings,
          authSettings: localBranding.authSettings,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update context (which will also update localStorage)
        updateContextBranding(localBranding);
        setBrandingSaveMessage('Branding saved successfully!');
      } else {
        // If API fails, still save to localStorage as fallback
        localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(localBranding));
        updateContextBranding(localBranding);
        setBrandingSaveMessage('Saved locally (API error: ' + data.error + ')');
      }
    } catch (error) {
      console.error('Failed to save branding to API:', error);
      // Fallback to localStorage
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(localBranding));
      updateContextBranding(localBranding);
      setBrandingSaveMessage('Saved locally (server unavailable)');
    }

    setTimeout(() => setBrandingSaveMessage(''), 3000);
  };

  const handleResetBranding = () => {
    if (confirm('Are you sure you want to reset branding to defaults?')) {
      setLocalBranding(DEFAULT_BRANDING);
      updateContextBranding(DEFAULT_BRANDING);
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
        <TabsContent value="form-builder" className="mt-6 h-[calc(100vh-12rem)]">
          <Card className="h-full flex flex-col overflow-hidden">
            <FormBuilderLayout
              header={
                <FormBuilderHeader
                  formName="Ticket Creation Form"
                  onFormNameChange={(name) => console.log('Form name changed:', name)}
                  onSave={handleSaveConfiguration}
                  onReset={handleResetForm}
                  saveStatus={hasUnsavedChanges ? 'unsaved' : 'saved'}
                  showConditionalIndicators={showConditionalIndicators}
                  onToggleConditionalIndicators={() =>
                    setShowConditionalIndicators(!showConditionalIndicators)
                  }
                />
              }
              palette={<FieldPalette />}
              livePreview={
                <LiveFormPreview
                  fields={fields}
                  selectedFieldId={selectedFieldId}
                  showConditionalIndicators={showConditionalIndicators}
                  onFieldsChange={setFields}
                  onFieldSelect={setSelectedFieldId}
                  onAddField={handleAddField}
                  onFieldSettingsClick={handleFieldSettingsClick}
                  onFieldDelete={handleFieldDelete}
                />
              }
            />

            {/* Field Properties Drawer */}
            <FieldPropertiesDrawer
              isOpen={isDrawerOpen}
              field={selectedField}
              allFields={fields}
              onFieldUpdate={handleFieldUpdate}
              onClose={handleDrawerClose}
            />
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
                      branding={localBranding}
                      onUpdate={handleUpdateBranding}
                      previewTheme={brandingPreviewTheme}
                      onPreviewThemeChange={setBrandingPreviewTheme}
                    />
                  </div>

                  {/* Right: Preview */}
                  <div className="lg:sticky lg:top-6 lg:self-start">
                    <BrandingPreview
                      branding={localBranding}
                      previewMode={brandingPreviewMode}
                      previewTheme={brandingPreviewTheme}
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
