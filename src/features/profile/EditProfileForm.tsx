import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/lib/errors';
import { useThemeColors } from '@/theme/useThemeMode';
import { AppHeader, Avatar, Backdrop, Button, KeyboardScrollView, TextField } from '@/ui';

import { HomeLocationField } from './HomeLocationField';
import type { PrivateProfile, Profile } from './profile.api';
import {
  useAvatarUrl,
  useMyPrivateProfile,
  useMyProfile,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from './profile.hooks';
import { CUSTOM_HOME, editProfileSchema, type EditProfile, type EditProfileInput } from './profile.schemas';
import { IntentField, PhoneFields } from './ProfileFields';

/** Edit profile (§9.9): photo, name, home, tag and phone. Loads your details first. */
export function EditProfileForm({ userId }: { userId: string }) {
  const c = useThemeColors();
  const profile = useMyProfile(userId);
  const priv = useMyPrivateProfile(userId);

  if (profile.data && priv.data) return <Form userId={userId} profile={profile.data} priv={priv.data} />;
  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <AppHeader eyebrow="Profile" title="Edit profile" onBack={() => router.back()} trailing={null} />
        {profile.error || priv.error ? (
          <Text className="type-body-sm px-space-4 text-danger" accessibilityRole="alert">
            {errorMessage(profile.error ?? priv.error)}
          </Text>
        ) : (
          <ActivityIndicator color={c.inkMuted} accessibilityLabel="Loading your profile" />
        )}
      </SafeAreaView>
    </Backdrop>
  );
}

function Form({ userId, profile, priv }: { userId: string; profile: Profile; priv: PrivateProfile }) {
  const save = useUpdateProfile(userId);
  const upload = useUploadAvatar(userId);
  const remove = useRemoveAvatar(userId);
  const photo = useAvatarUrl(profile.avatarPath);

  const { control, handleSubmit, formState } = useForm<EditProfileInput, unknown, EditProfile>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: profile.displayName,
      homeChoice: profile.collegeId ?? (profile.homeLabel ? CUSTOM_HOME : ''),
      homeLabel: profile.homeLabel ?? '',
      intent: profile.intent ?? 'none',
      phone: priv.phone ?? '',
      sharePhone: priv.sharePhone,
    },
  });
  const onSubmit = handleSubmit((values) => save.mutate(values, { onSuccess: () => router.back() }));

  // The system photo picker needs no permission prompt on iOS 14+ / Android 13+: the rider only
  // ever hands us the one photo they pick. Square crop, so it fits the round avatar.
  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) upload.mutate({ uri: result.assets[0].uri, previousPath: profile.avatarPath });
  };

  const photoBusy = upload.isPending || remove.isPending;
  const photoError = upload.error ?? remove.error;

  return (
    <Backdrop>
      <SafeAreaView className="flex-1">
        <KeyboardScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerClassName="gap-space-5 px-space-4 pb-space-7"
        >
          <View className="-mx-space-4">
            <AppHeader eyebrow="Profile" title="Edit profile" onBack={() => router.back()} trailing={null} />
          </View>

          <View className="items-center gap-space-3">
            <Avatar name={profile.displayName} src={photo.data} size={88} />
            <View className="flex-row gap-space-2">
              <Button
                variant="secondary"
                size="sm"
                loading={upload.isPending}
                disabled={photoBusy}
                onPress={choosePhoto}
              >
                {profile.avatarPath ? 'Change photo' : 'Add photo'}
              </Button>
              {profile.avatarPath && (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={remove.isPending}
                  disabled={photoBusy}
                  onPress={() => remove.mutate(profile.avatarPath!)}
                >
                  Remove
                </Button>
              )}
            </View>
            {photoError && (
              <Text className="type-body-sm text-danger" accessibilityRole="alert">
                {errorMessage(photoError)}
              </Text>
            )}
          </View>

          <Controller
            control={control}
            name="displayName"
            render={({ field }) => (
              <TextField
                label="Display name"
                placeholder="What riders call you"
                error={formState.errors.displayName?.message}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                maxLength={30}
                autoComplete="given-name"
                textContentType="givenName"
                returnKeyType="done"
              />
            )}
          />

          <View className="gap-space-2">
            <Text className="type-label text-ink-muted">Home</Text>
            <Controller
              control={control}
              name="homeChoice"
              render={({ field: choice }) => (
                <Controller
                  control={control}
                  name="homeLabel"
                  render={({ field: label }) => (
                    <HomeLocationField
                      choice={choice.value}
                      onChoiceChange={choice.onChange}
                      label={label.value}
                      onLabelChange={label.onChange}
                      choiceError={formState.errors.homeChoice?.message}
                      labelError={formState.errors.homeLabel?.message}
                    />
                  )}
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="intent"
            render={({ field }) => <IntentField value={field.value} onChange={field.onChange} />}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: phone }) => (
              <Controller
                control={control}
                name="sharePhone"
                render={({ field: share }) => (
                  <PhoneFields
                    phone={phone.value}
                    onPhoneChange={phone.onChange}
                    sharePhone={share.value}
                    onShareChange={share.onChange}
                    error={formState.errors.phone?.message}
                  />
                )}
              />
            )}
          />

          {save.error && (
            <Text className="type-body-sm text-danger" accessibilityRole="alert">
              {errorMessage(save.error)}
            </Text>
          )}
          <Button variant="primary" size="lg" block loading={save.isPending} onPress={() => onSubmit()}>
            Save changes
          </Button>
        </KeyboardScrollView>
      </SafeAreaView>
    </Backdrop>
  );
}
