import { useState, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatRideDate, formatRideTime, RIDE_TZ } from '@/lib/dates';
import { useThemeMode } from '@/theme/useThemeMode';

import {
  AppHeader,
  Avatar,
  AvatarStack,
  Backdrop,
  Button,
  ChatBubble,
  ChatComposer,
  CodeField,
  ContentCard,
  DateTimeField,
  EmptyState,
  Fab,
  GlassView,
  Icon,
  IconButton,
  Menu,
  Plane,
  RideCard,
  RiderRow,
  SeatStepper,
  SegmentedControl,
  Tag,
  TabBar,
  TextField,
  Timeline,
} from './index';
import { icons, type IconName } from './icons.generated';

// The /dev/ui gallery (spec §5.4): every ui/ component, all variants and states. Flip the theme
// at the top to check Charcoal. Sample data mirrors the artifact's AppScreens showcase.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-space-3">
      <Text className="type-label text-ink-muted" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const Row = ({ children }: { children: ReactNode }) => (
  <View className="flex-row flex-wrap items-center gap-space-3">{children}</View>
);

const TABS = (active: number) =>
  (['Rides', 'Chats', 'Alerts', 'Profile'] as const).map((label, i) => ({
    label,
    icon: (['plane-depart', 'chat', 'bell', 'user'] as const)[i],
    active: i === active,
  }));

const RIDES = [
  { date: 'Tue 3/18', time: '11:00 AM', taken: 2, riders: ['Niharika', 'Jake'] },
  { date: 'Tue 3/18', time: '11:30 AM', taken: 1, riders: ['Aarav'] },
  { date: 'Wed 3/19', time: '2:00 PM', taken: 4, riders: ['Leo', 'Ana', 'Kai', 'Zoe'] },
];

/** A phone-sized frame so screen compositions read like the artifact's showcase. */
function Phone({ tone = 'mist', children }: { tone?: 'mist' | 'sky'; children: ReactNode }) {
  return (
    <View className="h-[640px] overflow-hidden rounded-xl border border-glass-edge">
      <Backdrop tone={tone}>{children}</Backdrop>
    </View>
  );
}

export function Gallery() {
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = useThemeMode();
  const [direction, setDirection] = useState(0);
  const [seats, setSeats] = useState(4);
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('418');
  const [when, setWhen] = useState(() => new Date());
  const [replayKey, setReplayKey] = useState(0);

  return (
    <Backdrop>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 48 }}>
        <AppHeader eyebrow="Design system" title="Gallery" trailing={null} />
        <View className="gap-space-6 px-space-4">
          <SegmentedControl
            label="Theme"
            options={['Light', 'Dark']}
            value={theme === 'dark' ? 1 : 0}
            onChange={(i) => setTheme(i === 1 ? 'dark' : 'light')}
          />

          <Section title="Icon">
            <Row>
              {(Object.keys(icons) as IconName[]).map((n) => (
                <View key={n} className="items-center gap-space-1">
                  <Icon name={n} size={24} className="text-ink" />
                  <Text className="type-caption text-ink-muted">{n}</Text>
                </View>
              ))}
            </Row>
          </Section>

          <Section title="Button">
            <Button variant="primary">Post a ride</Button>
            <Row>
              <Button variant="sky" icon="plus">
                Join ride
              </Button>
              <Button variant="secondary">Cancel</Button>
              <Button variant="ghost">Skip</Button>
            </Row>
            <Row>
              <Button size="sm" variant="secondary">
                Small
              </Button>
              <Button variant="sky" loading>
                Loading
              </Button>
              <Button variant="sky" disabled>
                Disabled
              </Button>
            </Row>
            <Button size="lg" variant="sky" block iconEnd="arrow-right">
              Let’s go
            </Button>
          </Section>

          <Section title="IconButton">
            <Row>
              <IconButton icon="search" label="Search" variant="white" />
              <IconButton icon="bell" label="Notifications" variant="glass" />
              <IconButton icon="send" label="Send" variant="charcoal" />
              <IconButton icon="plus" label="Add" variant="sky" />
              <IconButton icon="phone" label="No number shared" variant="muted" disabled />
              <IconButton icon="phone" label="Call" variant="charcoal" size="sm" />
            </Row>
          </Section>

          <Section title="Fab">
            <Row>
              <Fab label="Post a ride" />
              <Fab label="Post a ride" extended />
            </Row>
          </Section>

          <Section title="Glass">
            <GlassView className="rounded-lg p-space-5">
              <Text className="type-heading text-ink">Glass panel</Text>
              <Text className="type-body-sm text-ink-muted">
                Blur, glass fill, glass-edge rim, shadow-glass.
              </Text>
            </GlassView>
          </Section>

          <Section title="TextField">
            <TextField
              label="School email"
              placeholder="you@ucsd.edu"
              hint="Only .edu addresses."
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextField label="Display name" placeholder="What riders call you" variant="glass" />
            <TextField label="Verification code" defaultValue="12345" error="Codes are 6 digits." />
          </Section>

          <Section title="CodeField">
            <CodeField value={code} onChangeText={setCode} />
            <CodeField value="123456" onChangeText={() => {}} error="That code is wrong or has expired." />
          </Section>

          <Section title="DateTimeField">
            <DateTimeField
              label="Date"
              mode="date"
              value={when}
              onChange={setWhen}
              format={formatRideDate}
              timeZoneName={RIDE_TZ}
            />
            <DateTimeField
              label="Leave campus at"
              mode="time"
              value={when}
              onChange={setWhen}
              format={formatRideTime}
              timeZoneName={RIDE_TZ}
              error="Pick a time at least 30 minutes from now."
            />
          </Section>

          <Section title="Tag">
            <Row>
              <Tag label="Networking" tone="sky" />
              <Tag label="FlyPal" tone="deep" />
              <Tag label="Sixth College" tone="glass" icon="pin" />
              <Tag label="Host" tone="charcoal" />
              <Tag label="Full" tone="go" icon="users" />
              <Tag label="Outline" tone="outline" />
            </Row>
          </Section>

          <Section title="Avatar · AvatarStack">
            <Row>
              <Avatar name="Niharika Sapre" />
              <Avatar name="Jake" />
              <Avatar name="Silvia" />
              <Avatar />
              <Avatar name="Leo" size={56} shape="tile" />
              <Avatar name="Niharika" size={88} />
            </Row>
            <Row>
              <AvatarStack names={['Niharika', 'Jake']} />
              <AvatarStack names={['Leo', 'Ana', 'Kai', 'Zoe', 'Mei']} />
            </Row>
          </Section>

          <Section title="SegmentedControl">
            <SegmentedControl
              label="Direction"
              options={[
                { label: 'To airport', icon: 'plane-depart' },
                { label: 'To campus', icon: 'plane-land' },
              ]}
              value={direction}
              onChange={setDirection}
            />
          </Section>

          <Section title="RideCard">
            <RideCard
              date="Tue 3/18"
              time="11:00 AM"
              seatsTaken={2}
              seatsMax={4}
              riders={['Niharika', 'Jake']}
              highlight
            />
            <RideCard date="Tue 3/18" time="11:30 AM" seatsTaken={1} seatsMax={4} riders={['Aarav']} />
            <RideCard
              date="Wed 3/19"
              time="2:00 PM"
              seatsTaken={4}
              seatsMax={4}
              riders={['Leo', 'Ana', 'Kai', 'Zoe']}
              direction="to-campus"
            />
          </Section>

          <Section title="RiderRow">
            <RiderRow name="Jake" college="Marshall" tag={{ label: 'Networking', tone: 'sky' }} />
            <RiderRow name="Silvia" college="Revelle" tag={{ label: 'FlyPal', tone: 'deep' }} phoneShared />
            <RiderRow name="You" college="Sixth College" showCall={false} />
          </Section>

          <Section title="SeatStepper">
            <View className="flex-row items-center justify-between">
              <Text className="type-body-sm font-600 text-ink">Max riders</Text>
              <SeatStepper label="Max riders" value={seats} onChange={setSeats} min={2} />
            </View>
          </Section>

          <Section title="Timeline">
            <Timeline
              steps={[
                { label: 'Posted', state: 'done' },
                { label: 'Matching', state: 'current' },
                { label: 'Meet', state: 'next' },
                { label: 'At SAN', state: 'next' },
              ]}
            />
            <Timeline
              steps={[
                { label: 'Posted', state: 'done' },
                { label: 'Matched', state: 'done' },
                { label: 'Meet', state: 'done' },
                { label: 'At campus', state: 'current' },
              ]}
            />
          </Section>

          <Section title="Chat">
            <View className="gap-space-3">
              <ChatBubble
                author="Niharika"
                time="8:23 AM"
                text="Let’s meet at the Sixth market, it’s central."
              />
              <ChatBubble mine time="8:25 AM" text="Works for me. See you at 10:40." />
              <ChatComposer value={message} onChangeText={setMessage} onSend={() => setMessage('')} />
            </View>
          </Section>

          <Section title="Menu">
            <Menu
              label="Profile"
              active={0}
              items={[
                { label: 'Display name', meta: 'Niharika', chevron: true },
                { label: 'School email', meta: 'Verified' },
                { label: 'Home college', meta: 'Sixth', chevron: true },
                { label: 'Notifications', meta: 'On', chevron: true },
                { label: 'Safety & reporting', chevron: true },
              ]}
            />
          </Section>

          <Section title="ContentCard">
            <ContentCard
              index="01"
              title="Matched by flight time"
              body="Rides to and from SAN with classmates on your schedule."
            />
            <ContentCard
              tone="sky"
              icon="plane-depart"
              title="Your next ride"
              body="Tue 3/18 · 11:00 AM · 2 of 4 seats"
            />
            <ContentCard
              tone="charcoal"
              index="02"
              title="Safety first"
              body="Only verified @ucsd.edu students can see rides."
            />
          </Section>

          <Section title="EmptyState">
            <GlassView className="rounded-lg">
              <EmptyState
                icon="plane-depart"
                title="No rides yet"
                body="Be the first to post one for this day."
                action={
                  <Button variant="sky" icon="plus">
                    Post a ride
                  </Button>
                }
              />
            </GlassView>
          </Section>

          <Section title="TabBar">
            <TabBar items={TABS(0)} />
          </Section>

          <Section title="Screen · Welcome">
            <Phone tone="sky">
              <View className="flex-1 justify-end gap-space-5 px-space-5 pb-space-6">
                <Plane key={replayKey} width={230} animate="glide" delay={300} label="" />
                <View>
                  <Text className="type-display text-on-atmos" maxFontSizeMultiplier={1.2}>
                    FlyTag.
                  </Text>
                  <Text className="type-body-lg mt-space-3 text-on-atmos">
                    Tag along with fellow classmates to and from the airport.
                  </Text>
                </View>
                <Button
                  variant="glass"
                  size="lg"
                  block
                  iconEnd="arrow-right"
                  onPress={() => setReplayKey((k) => k + 1)}
                >
                  Get started
                </Button>
              </View>
            </Phone>
          </Section>

          <Section title="AppHeader · inset">
            <Phone>
              <AppHeader eyebrow="Updates" title="Alerts" trailing={null} inset />
            </Phone>
          </Section>

          <Section title="Screen · Rides">
            <Phone>
              <AppHeader eyebrow="Rides from campus" title="UCSD" userName="Niharika" />
              <View className="px-space-4">
                <SegmentedControl
                  label="Direction"
                  options={[
                    { label: 'To airport', icon: 'plane-depart' },
                    { label: 'To campus', icon: 'plane-land' },
                  ]}
                />
              </View>
              <View className="gap-space-3 p-space-4">
                {RIDES.map((r, i) => (
                  <RideCard
                    key={r.time + r.date}
                    date={r.date}
                    time={r.time}
                    seatsTaken={r.taken}
                    seatsMax={4}
                    riders={r.riders}
                    highlight={i === 0}
                  />
                ))}
              </View>
              <View className="absolute bottom-[96px] left-0 right-0 items-center">
                <Fab label="Post a ride" />
              </View>
              <View className="absolute bottom-space-4 left-space-4 right-space-4">
                <TabBar items={TABS(0)} />
              </View>
            </Phone>
          </Section>

          <Section title="Screen · Ride">
            <Phone>
              <AppHeader
                eyebrow="Tue 3/18 · Niharika, Sixth"
                title="11:00 AM"
                onBack={() => {}}
                trailing={null}
              />
              <View className="gap-space-3 px-space-4">
                <Timeline
                  steps={[
                    { label: 'Posted', state: 'done' },
                    { label: 'Matching', state: 'current' },
                    { label: 'At SAN', state: 'next' },
                  ]}
                />
                <GlassView className="gap-space-2 rounded-lg p-space-5">
                  <Text className="type-label mb-space-1 text-ink-muted">Riders · 2 of 4</Text>
                  <RiderRow name="Jake" college="Marshall" tag={{ label: 'Networking', tone: 'sky' }} />
                  <RiderRow
                    name="Silvia"
                    college="Revelle"
                    tag={{ label: 'FlyPal', tone: 'deep' }}
                    phoneShared
                  />
                  <Button variant="sky" icon="plus" block>
                    Join ride
                  </Button>
                </GlassView>
              </View>
            </Phone>
          </Section>
        </View>
      </ScrollView>
    </Backdrop>
  );
}
