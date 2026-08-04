/**
 * Ambient types for react-native-web so this RN codebase compiles
 * in the web build. When moving to Expo/React Native, delete this file
 * and use the official react-native types instead.
 */
declare module "react-native-web" {
  import type * as React from "react";

  export type StyleProp<T> = T | Array<T | false | null | undefined> | false | null | undefined;
  export type ViewStyle = Record<string, unknown>;
  export type TextStyle = Record<string, unknown>;
  export type DimensionValue = number | string;

  export interface PressableProps {
    onPress?: (e: unknown) => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle | ((state: { pressed: boolean }) => StyleProp<ViewStyle>)>;
    children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
    accessibilityLabel?: string;
  }
  export interface TextInputProps {
    value?: string;
    onChangeText?: (t: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    style?: StyleProp<TextStyle>;
    keyboardType?: "default" | "numeric" | "phone-pad" | "email-address";
    autoFocus?: boolean;
    secureTextEntry?: boolean;
    multiline?: boolean;
  }

  export const View: React.FC<{ style?: StyleProp<ViewStyle>; children?: React.ReactNode }>;
  export const Text: React.FC<{ style?: StyleProp<TextStyle>; children?: React.ReactNode; numberOfLines?: number }>;
  export const Pressable: React.FC<PressableProps>;
  export const ScrollView: React.FC<{ style?: StyleProp<ViewStyle>; contentContainerStyle?: StyleProp<ViewStyle>; children?: React.ReactNode; keyboardShouldPersistTaps?: string; showsVerticalScrollIndicator?: boolean }>;
  export const TextInput: React.FC<TextInputProps>;
  export const SafeAreaView: React.FC<{ style?: StyleProp<ViewStyle>; children?: React.ReactNode }>;
  export const Modal: React.FC<{ visible?: boolean; transparent?: boolean; animationType?: string; onRequestClose?: () => void; children?: React.ReactNode }>;
  export const StyleSheet: {
    create<T extends Record<string, unknown>>(s: T): T;
    absoluteFill: ViewStyle;
  };
  export const Dimensions: { get: (k: "window" | "screen") => { width: number; height: number } };
  export const Platform: { OS: string };
}
