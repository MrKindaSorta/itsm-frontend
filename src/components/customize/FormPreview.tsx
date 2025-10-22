import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { FormField } from '@/types/formBuilder';
import { Badge } from '@/components/ui/badge';

interface FormPreviewProps {
  fields: FormField[];
  formTitle?: string;
}

export default function FormPreview({ fields, formTitle = 'Create Ticket' }: FormPreviewProps) {
  const renderField = (field: FormField) => {
    const labelElement = (
      <Label htmlFor={`preview-${field.id}`} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
    );

    const helpTextElement = field.helpText && (
      <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>
    );

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-1.5">
            {labelElement}
            <Input
              id={`preview-${field.id}`}
              placeholder={field.placeholder}
              defaultValue={field.defaultValue}
              required={field.required}
              maxLength={field.validation?.maxLength}
              disabled
            />
            {helpTextElement}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-1.5">
            {labelElement}
            <Textarea
              id={`preview-${field.id}`}
              placeholder={field.placeholder}
              defaultValue={field.defaultValue}
              required={field.required}
              maxLength={field.validation?.maxLength}
              disabled
            />
            {helpTextElement}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-1.5">
            {labelElement}
            <Input
              id={`preview-${field.id}`}
              type="number"
              placeholder={field.placeholder}
              defaultValue={field.defaultValue}
              required={field.required}
              min={field.validation?.min}
              max={field.validation?.max}
              disabled
            />
            {helpTextElement}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-1.5">
            {labelElement}
            <Input
              id={`preview-${field.id}`}
              type="date"
              defaultValue={field.defaultValue}
              required={field.required}
              disabled
            />
            {helpTextElement}
          </div>
        );

      case 'dropdown':
        return (
          <div key={field.id} className="space-y-1.5">
            {labelElement}
            <Select
              id={`preview-${field.id}`}
              defaultValue={field.defaultValue}
              required={field.required}
              disabled
            >
              <option value="">{field.placeholder || 'Select an option...'}</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            {helpTextElement}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.id} className="space-y-1.5">
            {labelElement}
            <Select
              id={`preview-${field.id}`}
              multiple
              required={field.required}
              disabled
              className="min-h-[100px]"
            >
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
            {helpTextElement}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <input
                id={`preview-${field.id}`}
                type="checkbox"
                defaultChecked={field.defaultValue}
                required={field.required}
                disabled
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor={`preview-${field.id}`} className="text-sm font-medium cursor-pointer">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {helpTextElement}
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-1.5">
            {labelElement}
            <Input
              id={`preview-${field.id}`}
              type="file"
              required={field.required}
              disabled
            />
            {helpTextElement}
          </div>
        );

      case 'priority':
      case 'category':
        return (
          <div key={field.id} className="space-y-1.5">
            {labelElement}
            <Select
              id={`preview-${field.id}`}
              defaultValue={field.defaultValue}
              required={field.required}
              disabled
            >
              <option value="">{field.placeholder || 'Select an option...'}</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            {helpTextElement}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Form Preview</CardTitle>
          <Badge variant="outline" className="text-xs">
            Read-only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          This is how users will see the form
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <p className="text-sm text-muted-foreground">
              No fields to preview yet
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Add fields to see them here
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-background rounded-lg border border-border p-6">
              <h2 className="text-2xl font-bold mb-2">{formTitle}</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Fill out the form below to create a new ticket
              </p>

              <form className="space-y-4">
                {fields.filter(field => !field.hidden).map((field) => renderField(field))}

                <div className="pt-4 border-t border-border">
                  <Button type="submit" disabled className="w-full sm:w-auto">
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
