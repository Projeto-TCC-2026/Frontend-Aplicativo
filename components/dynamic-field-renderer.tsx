import type { ReactNode } from 'react';
import Slider from '@react-native-community/slider';
import { Switch, Text, View } from 'react-native';
import { Button, TextField } from '@/components/ui';
import type { DynamicField } from '@/src/domain/checkin';

export type DynamicFieldValue = string | null;
export type DynamicFieldRendererProps = { field: DynamicField; value: DynamicFieldValue; onChange: (value: DynamicFieldValue) => void; error?: string; disabled?: boolean; onPickPhoto?: () => void; renderPhotoPreview?: (photoUrl: string) => ReactNode };

export function DynamicFieldRenderer({ field, value, onChange, error, disabled = false, onPickPhoto, renderPhotoPreview }: DynamicFieldRendererProps) {
  const label = field.required ? `${field.name} *` : field.name;
  return <View className="mb-[18px] gap-1.5"><Text className="font-body text-[15px] font-semibold text-neutral-900">{label}</Text>{field.description ? <Text className="font-body text-[13px] text-neutral-500">{field.description}</Text> : null}{renderControl(field, value, onChange, error, disabled, onPickPhoto, renderPhotoPreview)}{field.unit && field.dataType !== 'PHOTO' ? <Text className="font-body text-xs text-neutral-500">{field.unit}</Text> : null}{error ? <Text accessibilityRole="alert" className="font-body text-xs text-semantic-critical">{error}</Text> : null}</View>;
}

function renderControl(field: DynamicField, value: DynamicFieldValue, onChange: (value: DynamicFieldValue) => void, error: string | undefined, disabled: boolean, onPickPhoto?: () => void, renderPhotoPreview?: (photoUrl: string) => ReactNode) {
  if (field.dataType === 'BOOLEAN') return <View className="min-h-12 flex-row items-center justify-between"><Text className="font-body text-[15px] text-neutral-700">{value === 'true' ? 'Sim' : value === 'false' ? 'Não' : 'Não respondido'}</Text><Switch disabled={disabled} value={value === 'true'} onValueChange={(nextValue) => onChange(String(nextValue))} />;</View>;
  if (field.dataType === 'SCALE') { const { min, max } = getScaleRange(field); const current = value != null ? Number(value) : min; return <View className="gap-2"><Text accessibilityLiveRegion="polite" className="self-center font-data text-2xl font-semibold text-brand-dark">{current}</Text><Slider disabled={disabled} maximumValue={max} minimumValue={min} onValueChange={(nextValue) => onChange(String(Math.round(nextValue)))} step={1} style={{ width: '100%', height: 40 }} maximumTrackTintColor="#C3CDD6" minimumTrackTintColor="#0C4C8A" thumbTintColor="#0C4C8A" value={current} /><View className="flex-row justify-between"><Text className="font-body text-xs text-neutral-500">{min}</Text><Text className="font-body text-xs text-neutral-500">{max}</Text></View></View>; }
  if (field.dataType === 'PHOTO') return <View><Button accessibilityLabel={`Adicionar ${field.name}`} disabled={disabled || !onPickPhoto} onPress={onPickPhoto}>{value ? 'Trocar foto' : 'Adicionar foto'}</Button>{value && renderPhotoPreview ? renderPhotoPreview(value) : null}</View>;
  return <TextField accessibilityLabel={field.name} disabled={disabled} multiline={field.dataType === 'TEXT'} onChangeText={onChange} placeholder={field.dataType === 'TEXT' ? 'Digite sua resposta' : getRangePlaceholder(field)} state={error ? 'error' : 'default'} type={field.dataType === 'INTEGER' ? 'number' : field.dataType === 'DECIMAL' ? 'number' : 'text'} value={value ?? ''} />;
}

function getScaleRange(field: DynamicField): { min: number; max: number } { const min = Number.isInteger(field.minValue) ? field.minValue as number : 0; const max = Number.isInteger(field.maxValue) ? field.maxValue as number : 10; return max > min ? { min, max } : { min: 0, max: 10 }; }
function getRangePlaceholder(field: DynamicField): string | undefined { if (field.minValue == null && field.maxValue == null) return undefined; if (field.minValue != null && field.maxValue != null) return `${field.minValue} - ${field.maxValue}`; if (field.minValue != null) return `Mínimo: ${field.minValue}`; return `Máximo: ${field.maxValue}`; }
