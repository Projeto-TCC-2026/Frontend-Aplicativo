import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import type { DynamicField, FieldDataType } from '@/src/domain/checkin';

export type DynamicFieldValue = string | null;

export type DynamicFieldRendererProps = {
  field: DynamicField;
  value: DynamicFieldValue;
  onChange: (value: DynamicFieldValue) => void;
  error?: string;
  disabled?: boolean;
  onPickPhoto?: () => void;
  renderPhotoPreview?: (photoUrl: string) => ReactNode;
};

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
  onPickPhoto,
  renderPhotoPreview,
}: DynamicFieldRendererProps) {
  const label = field.required ? `${field.name} *` : field.name;
  const commonInputProps = {
    editable: !disabled,
    accessibilityLabel: field.name,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {field.description ? <Text style={styles.description}>{field.description}</Text> : null}
      {renderControl(field, value, onChange, commonInputProps, disabled, onPickPhoto, renderPhotoPreview)}
      {field.unit && field.dataType !== 'PHOTO' ? <Text style={styles.unit}>{field.unit}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function renderControl(
  field: DynamicField,
  value: DynamicFieldValue,
  onChange: (value: DynamicFieldValue) => void,
  inputProps: { editable: boolean; accessibilityLabel: string },
  disabled: boolean,
  onPickPhoto?: () => void,
  renderPhotoPreview?: (photoUrl: string) => ReactNode,
) {
  switch (field.dataType) {
    case 'BOOLEAN':
      return (
        <View style={styles.booleanRow}>
            <Text style={styles.booleanValue}>
              {value === 'true' ? 'Sim' : value === 'false' ? 'Não' : 'Não respondido'}
            </Text>
          <Switch
            {...inputProps}
            value={value === 'true'}
            onValueChange={(nextValue) => onChange(String(nextValue))}
          />
        </View>
      );
    case 'SCALE':
      return (
        <View style={styles.scaleRow} accessibilityRole="radiogroup">
          {getScaleOptions(field).map((option) => (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: value === String(option), disabled }}
              disabled={disabled}
              onPress={() => onChange(String(option))}
              style={[styles.scaleOption, value === String(option) && styles.scaleOptionSelected]}>
              <Text style={[styles.scaleText, value === String(option) && styles.scaleTextSelected]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    case 'PHOTO':
      return (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Adicionar ${field.name}`}
            disabled={disabled || !onPickPhoto}
            onPress={onPickPhoto}
            style={[styles.photoButton, (disabled || !onPickPhoto) && styles.disabled]}>
            <Text style={styles.photoButtonText}>{value ? 'Trocar foto' : 'Adicionar foto'}</Text>
          </Pressable>
          {value && renderPhotoPreview ? renderPhotoPreview(value) : null}
        </View>
      );
    case 'INTEGER':
    case 'DECIMAL':
      return (
        <TextInput
          {...inputProps}
          value={value ?? ''}
          onChangeText={onChange}
          keyboardType={field.dataType === 'INTEGER' ? 'number-pad' : 'decimal-pad'}
          placeholder={getRangePlaceholder(field)}
          style={[styles.input, disabled && styles.disabled]}
        />
      );
    case 'TEXT':
      return (
        <TextInput
          {...inputProps}
          value={value ?? ''}
          onChangeText={onChange}
          multiline
          placeholder="Digite sua resposta"
          style={[styles.input, styles.textArea, disabled && styles.disabled]}
        />
      );
  }
}

function getScaleOptions(field: DynamicField): number[] {
  const min = Number.isInteger(field.minValue) ? field.minValue as number : 1;
  const max = Number.isInteger(field.maxValue) ? field.maxValue as number : 5;
  if (max < min || max - min > 10) return [1, 2, 3, 4, 5];
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

function getRangePlaceholder(field: DynamicField): string | undefined {
  if (field.minValue == null && field.maxValue == null) return undefined;
  if (field.minValue != null && field.maxValue != null) return `${field.minValue} - ${field.maxValue}`;
  if (field.minValue != null) return `Mínimo: ${field.minValue}`;
  return `Máximo: ${field.maxValue}`;
}

const styles = StyleSheet.create({
  container: { gap: 6, marginBottom: 18 },
  label: { color: '#142230', fontSize: 15, fontWeight: '600' },
  description: { color: '#7C8DA1', fontSize: 13 },
  unit: { color: '#7C8DA1', fontSize: 12 },
  input: {
    borderColor: '#C3CDD6',
    borderRadius: 9,
    borderWidth: 1,
    color: '#142230',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: { minHeight: 92, textAlignVertical: 'top' },
  booleanRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 },
  booleanValue: { color: '#445468', fontSize: 15 },
  scaleRow: { flexDirection: 'row', gap: 8 },
  scaleOption: { alignItems: 'center', borderColor: '#C3CDD6', borderRadius: 9, borderWidth: 1, height: 44, justifyContent: 'center', minWidth: 44 },
  scaleOptionSelected: { backgroundColor: '#0C4C8A', borderColor: '#0C4C8A' },
  scaleText: { color: '#445468', fontWeight: '600' },
  scaleTextSelected: { color: '#FFFFFF' },
  photoButton: { alignItems: 'center', backgroundColor: '#0C4C8A', borderRadius: 9, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  photoButtonText: { color: '#FFFFFF', fontWeight: '600' },
  disabled: { backgroundColor: '#F1F3F5', color: '#7C8DA1' },
  error: { color: '#D9484B', fontSize: 12 },
});
