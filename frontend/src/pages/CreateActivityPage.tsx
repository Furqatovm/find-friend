import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Calendar,
  ArrowLeft,
  MapPin,
  Sparkles,
  Globe,
  Loader2,
  Building2
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface LocationSuggestion {
  title: string;
  subtitle: string;
  city?: string;
  type: 'popular' | 'online' | 'address';
}

const POPULAR_LOCATIONS: LocationSuggestion[] = [
  // Tashkent Study & Tech Hubs
  { title: 'Alisher Navoi National Library', subtitle: 'Navoi Street 1, Chilanzar, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'IT Park Uzbekistan Tech Hub', subtitle: 'Tepaqo‘rg‘on St 4, Yashnabad, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'C-Space Coworking Yunusabad', subtitle: 'Ahmad Donish St, Yunusabad, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'C-Space Coworking Labzak', subtitle: 'Labzak St 64, Shaykhontohur, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'GroundZero Coworking Chilanzar', subtitle: 'Chilanzar 2-block, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'GroundZero Coworking Kitob Olami', subtitle: 'Mustaqillik Ave 6, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'Westminster International University (WIUT)', subtitle: 'Istiqbol St 12, Mirabad, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'INHA University in Tashkent (IUT)', subtitle: 'Ziyolilar St 9, Mirzo Ulugbek, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'TUIT Information Technologies University', subtitle: 'Amir Temur St 108, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'Tashkent City Park & Boulevard', subtitle: 'Shaykhontohur, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'Amir Timur Square & Broadway', subtitle: 'Amir Temur Ave, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'Central Park (Telman Park)', subtitle: 'Movaraunnahr St, Mirzo Ulugbek, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'Eco Park Tashkent', subtitle: 'Mahkuma St, Mirzo Ulugbek, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'Book Cafe Oybek', subtitle: 'Oybek St 38, Mirabad, Tashkent', city: 'Tashkent', type: 'popular' },
  { title: 'B&B Coffee House', subtitle: 'Shota Rustaveli St, Yakkasaray, Tashkent', city: 'Tashkent', type: 'popular' },
  // Online Meetup Options
  { title: 'Discord Voice & Video Channel', subtitle: 'WithMe Community Discord Guild', type: 'online' },
  { title: 'Google Meet Session', subtitle: 'Interactive video session (link posted in chat)', type: 'online' },
  { title: 'Zoom Meeting Room', subtitle: 'Interactive webinar room (link posted in chat)', type: 'online' },
  { title: 'Telegram Group Voice Chat', subtitle: 'Live audio stream & screen share', type: 'online' }
];

export const CreateActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Location suggestions state
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<{
    title: string;
    description: string;
    category: string;
    location_type: string;
    general_location: string;
    city: string;
    event_date: string;
    event_time: string;
    max_participants: number;
    required_skills: string;
  }>({
    defaultValues: {
      category: 'Study',
      location_type: 'in_person',
      max_participants: 6,
      event_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      event_time: '18:00',
      city: 'Tashkent'
    }
  });

  const locationType = watch('location_type') || 'in_person';

  // Real-time debounced location suggestion filtering & fetching
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const query = locationInput.trim().toLowerCase();

    // If query is empty, show relevant popular defaults
    if (!query) {
      if (locationType === 'online') {
        setSuggestions(POPULAR_LOCATIONS.filter((l) => l.type === 'online'));
      } else {
        setSuggestions(POPULAR_LOCATIONS.filter((l) => l.type === 'popular').slice(0, 6));
      }
      return;
    }

    // 1. Instant local matching
    const localMatches = POPULAR_LOCATIONS.filter((l) =>
      l.title.toLowerCase().includes(query) ||
      l.subtitle.toLowerCase().includes(query) ||
      (l.city && l.city.toLowerCase().includes(query))
    );
    setSuggestions(localMatches);

    // 2. Dynamic live Nominatim geocoding search if >= 3 characters and not strictly online
    if (locationType !== 'online' && query.length >= 3) {
      setLoadingSuggestions(true);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
          );
          const data = await res.json();
          if (Array.isArray(data)) {
            const apiSuggestions: LocationSuggestion[] = data.map((item: any) => ({
              title: item.name || item.display_name.split(',')[0],
              subtitle: item.display_name,
              city: item.address?.city || item.address?.town || item.address?.state || 'Tashkent',
              type: 'address'
            }));

            setSuggestions((prev) => {
              const combined = [...prev];
              apiSuggestions.forEach((apiItem) => {
                if (!combined.some((c) => c.title.toLowerCase() === apiItem.title.toLowerCase())) {
                  combined.push(apiItem);
                }
              });
              return combined.slice(0, 7);
            });
          }
        } catch {
          // ignore network failures
        } finally {
          setLoadingSuggestions(false);
        }
      }, 350);
    }
  }, [locationInput, locationType]);

  // Click outside to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsBoxRef.current && !suggestionsBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (sug: LocationSuggestion) => {
    setValue('general_location', sug.title);
    setLocationInput(sug.title);
    if (sug.city) {
      setValue('city', sug.city);
    }
    setShowSuggestions(false);
  };

  const quickChips = locationType === 'online'
    ? ['Discord Voice', 'Google Meet', 'Zoom Room', 'Telegram Voice']
    : ['National Library', 'IT Park', 'C-Space Coworking', 'GroundZero', 'Tashkent City Park', 'Book Cafe'];

  const onSubmit = async (data: any) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/activities', data);
      notify.success('Activity Created!', `"${data.title}" has been created.`);
      navigate(`/activities/${res.data.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create activity';
      setErrorMsg(msg);
      notify.error('Creation Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Study', 'Coding', 'Gaming', 'Languages', 'Sports', 'Music', 'Creative', 'Startups', 'Reading', 'Other'];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 text-neutral-900 dark:text-white transition-colors duration-200">
      <Link to="/activities" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to activities
      </Link>

      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            New Session / Meetup
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">HOST AN ACTIVITY</h1>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
            Create a session for study, coding, gaming, or physical sports.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Activity Title"
            placeholder="e.g. SAT Math Sprint, Hackathon Jam, 5v5 Football"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] mb-1.5">Category</label>
              <Select
                defaultValue="Study"
                onValueChange={(val) => setValue('category', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] mb-1.5">Format</label>
              <Select
                defaultValue="in_person"
                onValueChange={(val: any) => {
                  setValue('location_type', val);
                  if (val === 'online' && !locationInput) {
                    setValue('general_location', 'Discord Voice Channel');
                    setLocationInput('Discord Voice Channel');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">📍 In Person</SelectItem>
                  <SelectItem value="online">🌐 Online</SelectItem>
                  <SelectItem value="hybrid">⚡ Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            label="Description & Plan"
            placeholder="What will you be doing? What should participants prepare or bring?"
            rows={4}
            {...register('description', { required: 'Description is required' })}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              {...register('event_date', { required: 'Date is required' })}
              error={errors.event_date?.message}
            />
            <Input
              label="Time"
              type="time"
              {...register('event_time', { required: 'Time is required' })}
              error={errors.event_time?.message}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* General Location with Autocomplete Suggestions Dropdown */}
            <div className="relative" ref={suggestionsBoxRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-neutral-700 dark:text-[#D4D4D4]">
                  General Location / Venue
                </label>
                {loadingSuggestions && (
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Searching...
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder={locationType === 'online' ? 'e.g. Discord, Google Meet, Zoom' : 'e.g. Central Library, IT Park, C-Space'}
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setValue('general_location', e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full bg-white dark:bg-[#0F0F0F] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] rounded-xl px-3.5 py-2 pl-9 text-sm border border-neutral-200 dark:border-[#242424] transition-all duration-150 focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A] shadow-xs"
                />
                <div className="absolute left-3 top-2.5 text-neutral-400 dark:text-[#8A8A8A] pointer-events-none">
                  {locationType === 'online' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
              </div>

              {/* Suggestions Dropdown Popup */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#2E2E2E] rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-neutral-100 dark:border-[#242424] text-[10px] font-bold text-neutral-400 dark:text-[#7A7A7A] uppercase tracking-wider flex items-center justify-between">
                    <span>Suggested Locations</span>
                    <span className="text-[9px] font-normal lowercase">{suggestions.length} results</span>
                  </div>

                  <div className="p-1 space-y-0.5">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left hover:bg-neutral-100 dark:hover:bg-[#1F1F1F] transition-colors cursor-pointer group"
                      >
                        <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-[#252525] text-neutral-600 dark:text-[#D4D4D4] group-hover:text-amber-500 shrink-0 mt-0.5">
                          {sug.type === 'online' ? (
                            <Globe className="w-3.5 h-3.5" />
                          ) : sug.type === 'popular' ? (
                            <Building2 className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                              {sug.title}
                            </p>
                            {sug.type === 'popular' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                                Popular
                              </span>
                            )}
                          </div>
                          {sug.subtitle && (
                            <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] truncate mt-0.5">
                              {sug.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick suggestion tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-400 dark:text-[#6C6C6C] font-medium flex items-center gap-1 self-center">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Quick:
                </span>
                {quickChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSelectSuggestion({
                      title: chip,
                      subtitle: '',
                      type: locationType === 'online' ? 'online' : 'popular'
                    })}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#1A1A1A] hover:bg-neutral-200 dark:hover:bg-[#252525] border border-neutral-200 dark:border-[#292929] text-neutral-700 dark:text-[#D4D4D4] transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Max Participants"
              type="number"
              min={2}
              max={50}
              {...register('max_participants')}
            />
          </div>

          <Input
            label="Required Skills / Topics (Optional)"
            placeholder="e.g. React, SAT Math, Unity (comma separated)"
            {...register('required_skills')}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-[#242424]">
            <Link to="/activities">
              <Button variant="ghost" size="md">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" size="md" loading={loading} className="font-bold">
              Publish Activity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
