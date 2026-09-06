import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import type { DynamicField, FieldDataType } from '@/src/domain/checkin';
import { colors, fonts, radii } from '@/constants/design-tokens';

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
  label: { color: colors.neutral900, fontFamily: fonts.body, fontSize: 15, fontWeight: '600' },
  description: { color: colors.neutral500, fontFamily: fonts.body, fontSize: 13 },
  unit: { color: colors.neutral500, fontFamily: fonts.body, fontSize: 12 },
  input: {
    borderColor: colors.neutral300,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.neutral900,
    fontFamily: fonts.body,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: { minHeight: 92, textAlignVertical: 'top' },
  booleanRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 48 },
  booleanValue: { color: colors.neutral700, fontFamily: fonts.body, fontSize: 15 },
  scaleRow: { flexDirection: 'row', gap: 8 },
  scaleOption: { alignItems: 'center', borderColor: colors.neutral300, borderRadius: radii.sm, borderWidth: 1, height: 44, justifyContent: 'center', minWidth: 44 },
  scaleOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  scaleText: { color: colors.neutral700, fontFamily: fonts.data, fontWeight: '600' },
  scaleTextSelected: { color: colors.white },
  photoButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.sm, justifyContent: 'center', minHeight: 48, paddingHorizontal: 16 },
  photoButtonText: { color: colors.white, fontFamily: fonts.body, fontWeight: '600' },
  disabled: { backgroundColor: colors.disabledBackground, color: colors.neutral500 },
  error: { color: colors.critical, fontFamily: fonts.body, fontSize: 12 },
});
