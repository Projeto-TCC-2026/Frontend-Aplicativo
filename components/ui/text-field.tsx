import { forwardRef, useState } from 'react';
import type { TextInput as TextInputType } from 'react-native';
import { Text, TextInput, View } from 'react-native';

export type TextFieldState = 'default' | 'error' | 'success';
export type TextFieldType = 'text' | 'email' | 'password' | 'number' | 'tel';
export type TextFieldProps = { label?: string; placeholder?: string; value?: string; onChangeText?: (value: string) => void; type?: TextFieldType; state?: TextFieldState; helperText?: string; required?: boolean; disabled?: boolean; multiline?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; accessibilityLabel?: string };

const keyboardTypes = { text: 'default', email: 'email-address', password: 'default', number: 'decimal-pad', tel: 'phone-pad' } as const;

export const TextField = forwardRef<TextInputType, TextFieldProps>(function TextField({ label, placeholder, value, onChangeText, type = 'text', state = 'default', helperText, required = false, disabled = false, multiline = false, autoCapitalize = 'sentences', accessibilityLabel }, ref) {
  const [focused, setFocused] = useState(false);
  const borderClass = state === 'error' ? 'border-semantic-critical' : state === 'success' ? 'border-semantic-success' : focused ? 'border-brand-dark' : 'border-neutral-300';
  const helperClass = state === 'error' ? 'text-semantic-critical' : state === 'success' ? 'text-semantic-success' : 'text-neutral-500';
  return (
    <View className="gap-1.5">
      {label ? <Text className="font-body text-sm font-semibold text-neutral-900">{label}{required ? ' *' : ''}</Text> : null}
      <TextInput ref={ref} accessibilityLabel={accessibilityLabel ?? label} autoCapitalize={autoCapitalize} editable={!disabled} keyboardType={keyboardTypes[type]} multiline={multiline} onBlur={() => setFocused(false)} onChangeText={onChangeText} onFocus={() => setFocused(true)} placeholder={placeholder} placeholderTextColor="#7C8DA1" secureTextEntry={type === 'password'} className={`min-h-12 rounded-[9px] border-[1.5px] bg-white px-3.5 py-2.5 font-body text-[15px] text-neutral-900 ${borderClass} ${multiline ? 'min-h-24 text-align-top' : ''} ${disabled ? 'bg-semantic-disabled-bg text-neutral-500' : ''}`} value={value} />
      {helperText ? <Text className={`font-body text-xs leading-4 ${helperClass}`}>{helperText}</Text> : null}
    </View>
  );
});
