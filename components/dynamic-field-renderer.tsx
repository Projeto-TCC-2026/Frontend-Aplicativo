import type { ReactNode } from "react";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Switch, Text, useColorScheme, View } from "react-native";
import { Button, TextField } from "@/components/ui";
import type { DynamicField } from "@/src/domain/checkin";
import { colors } from "@/constants/design-tokens";

export type DynamicFieldValue = string | null;
export type DynamicFieldRendererProps = {
  field: DynamicField;
  value: DynamicFieldValue;
  onChange: (value: DynamicFieldValue) => void;
  error?: string;
  disabled?: boolean;
  onPickPhoto?: () => void;
  onRemovePhoto?: () => void;
  renderPhotoPreview?: (photoUrl: string) => ReactNode;
};

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled = false,
  onPickPhoto,
  onRemovePhoto,
  renderPhotoPreview,
}: DynamicFieldRendererProps) {
  const colorScheme = useColorScheme();
  const label = getFieldLabel(field);
  return (
    <View className="mb-[18px] gap-1.5">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="flex-1 font-body text-[15px] font-semibold text-neutral-900 dark:text-theme-dark-text-primary">
          {label}
        </Text>
        {field.dataType === "SCALE" ? (
          <ScaleValue field={field} value={value} />
        ) : null}
      </View>
      {field.description ? (
        <Text className="font-body text-[13px] text-neutral-500 dark:text-theme-dark-text-tertiary">
          {field.description}
        </Text>
      ) : null}
      {renderControl(
        field,
        value,
        onChange,
        error,
        disabled,
        onPickPhoto,
        onRemovePhoto,
        renderPhotoPreview,
        colorScheme === "dark",
      )}
      {error ? (
        <Text
          accessibilityRole="alert"
          className="font-body text-xs text-semantic-critical"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function getFieldLabel(field: DynamicField): string {
  const unit = field.unit && field.dataType !== "PHOTO" ? ` (${field.unit})` : "";
  const requiredMarker = field.required ? " *" : "";
  return `${field.name}${unit}${requiredMarker}`;
}

function ScaleValue({
  field,
  value,
}: {
  field: DynamicField;
  value: DynamicFieldValue;
}) {
  const { min } = getScaleRange(field);
  const current = value != null ? Number(value) : min;

  return (
    <View className="min-w-10 items-center rounded-full bg-brand-dark px-3 py-1 dark:bg-theme-dark-action">
      <Text
        accessibilityLiveRegion="polite"
        className="font-data text-sm font-semibold text-white dark:text-theme-dark-background"
      >
        {current}
      </Text>
    </View>
  );
}

function renderControl(
  field: DynamicField,
  value: DynamicFieldValue,
  onChange: (value: DynamicFieldValue) => void,
  error: string | undefined,
  disabled: boolean,
  onPickPhoto?: () => void,
  onRemovePhoto?: () => void,
  renderPhotoPreview?: (photoUrl: string) => ReactNode,
  isDark = false,
) {
  if (field.dataType === "BOOLEAN")
    return (
      <View className="min-h-12 flex-row items-center justify-between">
        <Text className="font-body text-[15px] text-neutral-700 dark:text-theme-dark-text-secondary">
          {value === "true"
            ? "Sim"
            : value === "false"
              ? "Não"
              : "Não respondido"}
        </Text>
        <Switch
          disabled={disabled}
          value={value === "true"}
          onValueChange={(nextValue) => onChange(String(nextValue))}
        />
      </View>
    );
  if (field.dataType === "SCALE") {
    const { min, max } = getScaleRange(field);
    const current = value != null ? Number(value) : min;
    return (
      <View>
        <Slider
          disabled={disabled}
          maximumValue={max}
          minimumValue={min}
          onValueChange={(nextValue) => onChange(String(Math.round(nextValue)))}
          step={1}
          style={{ width: "100%", height: 40 }}
          maximumTrackTintColor={
            isDark ? colors.darkSliderTrack : colors.neutral300
          }
          minimumTrackTintColor={colors.primary}
          thumbTintColor={colors.primary}
          value={current}
        />
        <View className="flex-row justify-between">
          <Text className="font-body text-xs text-neutral-500 dark:text-theme-dark-text-tertiary">
            {min}
          </Text>
          <Text className="font-body text-xs text-neutral-500 dark:text-theme-dark-text-tertiary">
            {max}
          </Text>
        </View>
      </View>
    );
  }
  if (field.dataType === "PHOTO")
    return (
      <View>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Button
              accessibilityLabel={`Adicionar ${field.name}`}
              disabled={disabled || !onPickPhoto}
              onPress={onPickPhoto}
            >
              {value ? "Trocar foto" : "Adicionar foto"}
            </Button>
          </View>
          {value && onRemovePhoto ? (
            <Pressable
              accessibilityLabel={`Remover foto de ${field.name}`}
              accessibilityRole="button"
              accessibilityState={{ disabled }}
              className="h-12 w-12 items-center justify-center rounded-[9px] border border-semantic-critical bg-semantic-criticalBackground"
              disabled={disabled}
              hitSlop={8}
              onPress={onRemovePhoto}
            >
              <Ionicons color={colors.critical} name="trash-outline" size={22} />
            </Pressable>
          ) : null}
        </View>
        {value && renderPhotoPreview ? renderPhotoPreview(value) : null}
      </View>
    );
  return (
    <TextField
      accessibilityLabel={field.name}
      disabled={disabled}
      multiline={field.dataType === "TEXT"}
      onChangeText={onChange}
      placeholder={
        field.dataType === "TEXT"
          ? "Digite sua resposta"
          : getRangePlaceholder(field)
      }
      state={error ? "error" : "default"}
      type={
        field.dataType === "INTEGER"
          ? "number"
          : field.dataType === "DECIMAL"
            ? "number"
            : "text"
      }
      value={value ?? ""}
    />
  );
}

function getScaleRange(field: DynamicField): { min: number; max: number } {
  const min = Number.isInteger(field.minValue) ? (field.minValue as number) : 0;
  const max = Number.isInteger(field.maxValue)
    ? (field.maxValue as number)
    : 10;
  return max > min ? { min, max } : { min: 0, max: 10 };
}
function getRangePlaceholder(field: DynamicField): string | undefined {
  if (field.minValue == null && field.maxValue == null) return undefined;
  if (field.minValue != null && field.maxValue != null)
    return `${field.minValue} - ${field.maxValue}`;
  if (field.minValue != null) return `Mínimo: ${field.minValue}`;
  return `Máximo: ${field.maxValue}`;
}
