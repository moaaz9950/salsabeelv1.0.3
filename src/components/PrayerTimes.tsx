import React, { useState, useEffect } from 'react';
import { Timer, Bell, MapPin, AlertCircle, Calendar, Settings, Globe, Moon, Sun, Star, Compass, Navigation, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

interface PrayerTimesData {
  timings: {
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
  };
  date: {
    readable: string;
    timestamp: string;
    hijri: {
      date: string;
      format: string;
      day: string;
      weekday: {
        en: string;
        ar: string;
      };
      month: {
        number: number;
        en: string;
        ar: string;
      };
      year: string;
      designation: {
        abbreviated: string;
        expanded: string;
      };
      holidays: string[];
    };
    gregorian: {
      date: string;
      format: string;
      day: string;
      weekday: {
        en: string;
      };
      month: {
        number: number;
        en: string;
      };
      year: string;
      designation: {
        abbreviated: string;
        expanded: string;
      };
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
      params: any;
    };
    latitudeAdjustmentMethod: string;
    midnightMode: string;
    school: string;
    offset: any;
  };
}

const CALCULATION_METHODS = [
  { id: 0, name: "Jafari / Shia Ithna-Ashari", nameAr: "الجعفري / الشيعة الإثنا عشرية" },
  { id: 1, name: "University of Islamic Sciences, Karachi", nameAr: "جامعة العلوم الإسلامية، كراتشي" },
  { id: 2, name: "Islamic Society of North America", nameAr: "الجمعية الإسلامية لأمريكا الشمالية" },
  { id: 3, name: "Muslim World League", nameAr: "رابطة العالم الإسلامي" },
  { id: 4, name: "Umm Al-Qura University, Makkah", nameAr: "جامعة أم القرى، مكة" },
  { id: 5, name: "Egyptian General Authority of Survey", nameAr: "الهيئة المصرية العامة للمساحة" },
  { id: 7, name: "Institute of Geophysics, University of Tehran", nameAr: "معهد الجيوفيزياء، جامعة طهران" },
  { id: 8, name: "Gulf Region", nameAr: "منطقة الخليج" },
  { id: 9, name: "Kuwait", nameAr: "الكويت" },
  { id: 10, name: "Qatar", nameAr: "قطر" },
  { id: 11, name: "Majlis Ugama Islam Singapura, Singapore", nameAr: "مجلس الشؤون الإسلامية، سنغافورة" },
  { id: 12, name: "Union Organization islamic de France", nameAr: "الاتحاد الإسلامي في فرنسا" },
  { id: 13, name: "Diyanet İşleri Başkanlığı, Turkey", nameAr: "رئاسة الشؤون الدينية، تركيا" },
  { id: 14, name: "Spiritual Administration of Muslims of Russia", nameAr: "الإدارة الروحية لمسلمي روسيا" },
  { id: 15, name: "Moonsighting Committee Worldwide", nameAr: "لجنة رؤية الهلال العالمية" },
  { id: 16, name: "Dubai (experimental)", nameAr: "دبي (تجريبي)" },
  { id: 17, name: "Jabatan Kemajuan Islam Malaysia (JAKIM)", nameAr: "دائرة التطوير الإسلامي الماليزية" },
  { id: 18, name: "Tunisia", nameAr: "تونس" },
  { id: 19, name: "Algeria", nameAr: "الجزائر" },
  { id: 20, name: "KEMENAG - Indonesia", nameAr: "وزارة الشؤون الدينية - إندونيسيا" },
  { id: 21, name: "Morocco", nameAr: "المغرب" },
  { id: 22, name: "Comunidade Islamica de Lisboa", nameAr: "الجالية الإسلامية في لشبونة" },
  { id: 23, name: "Ministry of Awqaf, Jordan", nameAr: "وزارة الأوقاف، الأردن" }
];

const PRAYER_NAMES = {
  en: {
    Fajr: "Fajr",
    Sunrise: "Sunrise",
    Dhuhr: "Dhuhr",
    Asr: "Asr",
    Maghrib: "Maghrib",
    Isha: "Isha"
  },
  ar: {
    Fajr: "الفجر",
    Sunrise: "الشروق",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Maghrib: "المغرب",
    Isha: "العشاء"
  }
};

const PRAYER_ICONS = {
  Fajr: Moon,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Star,
  Isha: Moon
};

export default function PrayerTimes() {
  const { theme } = useTheme();
  const [prayerData, setPrayerData] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number, city?: string, country?: string} | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{name: string, time: string, timeRemaining: string} | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<number>(3);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('ar');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [manualLocation, setManualLocation] = useState({ city: '', country: '' });
  const [showManualInput, setShowManualInput] = useState(false);
  const [locationMethod, setLocationMethod] = useState<'auto' | 'manual'>('auto');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      loadPrayerTimes();
    }
  }, [location, calculationMethod]);

  useEffect(() => {
    if (prayerData) {
      calculateNextPrayer();
      const interval = setInterval(calculateNextPrayer, 60000);
      return () => clearInterval(interval);
    }
  }, [prayerData, currentTime]);

  async function checkLocationPermission() {
    try {
      if (!navigator.geolocation) {
        setLocationPermission('denied');
        setShowManualInput(true);
        return;
      }

      // Check if we already have permission
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(permission.state);
        
        if (permission.state === 'granted') {
          getUserLocation();
        } else if (permission.state === 'denied') {
          setShowManualInput(true);
        }
      } else {
        // Fallback for browsers without permissions API
        setLocationPermission('prompt');
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission('prompt');
    }
  }

  async function requestLocationPermission() {
    try {
      setLocationPermission('checking');
      getUserLocation();
    } catch (error) {
      console.error('Error requesting location:', error);
      setLocationPermission('denied');
      setShowManualInput(true);
    }
  }

  async function getUserLocation() {
    try {
      setLoading(true);
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setLocationPermission('granted');
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Get city and country from reverse geocoding
            try {
              const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
              const data = await response.json();
              
              setLocation({
                lat,
                lng,
                city: data.city || data.locality || 'Unknown',
                country: data.countryName || 'Unknown'
              });
              setLocationMethod('auto');
              setShowManualInput(false);
            } catch (geoError) {
              console.error('Geocoding error:', geoError);
              setLocation({ lat, lng, city: 'Unknown', country: 'Unknown' });
            }
          },
          (err) => {
            console.error('Geolocation error:', err);
            setLocationPermission('denied');
            setShowManualInput(true);
            setError(language === 'ar' ? 'فشل في الحصول على الموقع. يرجى إدخال موقعك يدوياً.' : 'Failed to get location. Please enter your location manually.');
          }
        );
      } else {
        setLocationPermission('denied');
        setShowManualInput(true);
        setError(language === 'ar' ? 'خدمات الموقع غير مدعومة في هذا المتصفح.' : 'Geolocation is not supported by this browser.');
      }
    } catch (err) {
      console.error('Location error:', err);
      setLocationPermission('denied');
      setShowManualInput(true);
      setError(language === 'ar' ? 'خطأ في الحصول على الموقع.' : 'Error getting location.');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualLocation() {
    if (!manualLocation.city || !manualLocation.country) {
      setError(language === 'ar' ? 'يرجى إدخال المدينة والدولة' : 'Please enter both city and country');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use geocoding to get coordinates from city/country
      const geocodeResponse = await fetch(
        `https://api.bigdatacloud.net/data/city?name=${encodeURIComponent(manualLocation.city)}&countryName=${encodeURIComponent(manualLocation.country)}&localityLanguage=en`
      );
      
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.latitude && geocodeData.longitude) {
          setLocation({
            lat: geocodeData.latitude,
            lng: geocodeData.longitude,
            city: manualLocation.city,
            country: manualLocation.country
          });
          setLocationMethod('manual');
          setShowManualInput(false);
          return;
        }
      }
      
      // Fallback: use the manual location for API call even without coordinates
      setLocation({
        lat: 0, // Will be ignored in favor of city/country
        lng: 0,
        city: manualLocation.city,
        country: manualLocation.country
      });
      setLocationMethod('manual');
      setShowManualInput(false);
      
    } catch (error) {
      console.error('Geocoding error:', error);
      setError(language === 'ar' ? 'فشل في العثور على الموقع. تحقق من اسم المدينة والدولة.' : 'Failed to find location. Please check city and country names.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPrayerTimes() {
    if (!location) return;

    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const formattedDate = format(today, 'dd-MM-yyyy');
      let apiUrl: string;

      if (locationMethod === 'manual' || (!location.lat && !location.lng)) {
        // Use address-based API for manual location
        const address = `${location.city}, ${location.country}`;
        apiUrl = `https://api.aladhan.com/v1/timingsByAddress/${formattedDate}?address=${encodeURIComponent(address)}&method=${calculationMethod}&shafaq=general`;
      } else {
        // Use coordinate-based API for automatic location
        apiUrl = `https://api.aladhan.com/v1/timings/${formattedDate}?latitude=${location.lat}&longitude=${location.lng}&method=${calculationMethod}&shafaq=general`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.code === 200 && data.data) {
        setPrayerData(data.data);
        setError(null);
      } else {
        throw new Error(data.data || 'Invalid API response');
      }
    } catch (err) {
      console.error('Failed to fetch prayer times:', err);
      setError(language === 'ar' ? 'فشل في تحميل أوقات الصلاة. يرجى المحاولة مرة أخرى.' : 'Failed to load prayer times. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function calculateNextPrayer() {
    if (!prayerData) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Fajr', time: prayerData.timings.Fajr },
      { name: 'Sunrise', time: prayerData.timings.Sunrise },
      { name: 'Dhuhr', time: prayerData.timings.Dhuhr },
      { name: 'Asr', time: prayerData.timings.Asr },
      { name: 'Maghrib', time: prayerData.timings.Maghrib },
      { name: 'Isha', time: prayerData.timings.Isha }
    ];
    
    // Convert prayer times to minutes since midnight
    const prayerMinutes = prayers.map(prayer => {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      return { name: prayer.name, minutes: hours * 60 + minutes };
    });
    
    // Find the next prayer
    let next = prayerMinutes.find(prayer => prayer.minutes > currentTime);
    
    // If no prayer is found, it means all prayers for today have passed
    if (!next) {
      next = { name: 'Fajr', minutes: prayerMinutes[0].minutes + 24 * 60 };
    }
    
    // Calculate time remaining
    const minutesRemaining = next.minutes - currentTime;
    const hoursRemaining = Math.floor(minutesRemaining / 60);
    const minsRemaining = minutesRemaining % 60;
    
    const timeRemainingStr = language === 'ar' 
      ? `${hoursRemaining} ساعة ${minsRemaining} دقيقة`
      : `${hoursRemaining}h ${minsRemaining}m`;
    
    // Find the original time string
    const originalPrayer = prayers.find(p => p.name === next.name);
    const timeStr = originalPrayer ? originalPrayer.time : '';
    
    setNextPrayer({ 
      name: next.name, 
      time: timeStr, 
      timeRemaining: timeRemainingStr 
    });
  }

  const toggleNotifications = () => {
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(!notificationsEnabled);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationsEnabled(true);
        }
      });
    }
  };

  const refreshPrayerTimes = () => {
    if (location) {
      loadPrayerTimes();
    }
  };

  const currentMethod = CALCULATION_METHODS.find(m => m.id === calculationMethod);

  if (loading) return (
    <div className={cn(
      "bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 rounded-2xl shadow-2xl p-8 flex justify-center items-center min-h-[400px]",
      theme === 'ramadan' ? 'from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900 dark:via-orange-900 dark:to-yellow-900' : ''
    )}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-emerald-600 dark:text-emerald-400 font-medium">
          {language === 'ar' ? 'جاري تحميل أوقات الصلاة...' : 'Loading prayer times...'}
        </p>
      </div>
    </div>
  );

  // Location Permission Request Screen
  if (locationPermission === 'prompt' || (locationPermission === 'denied' && !location)) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 rounded-2xl shadow-2xl overflow-hidden",
        theme === 'ramadan' ? 'from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900 dark:via-orange-900 dark:to-yellow-900' : ''
      )}>
        <div className={cn(
          "relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800 p-6",
          theme === 'ramadan' ? 'from-amber-600 via-orange-600 to-yellow-600 dark:from-amber-800 dark:via-orange-800 dark:to-yellow-800' : ''
        )}>
          <div className="relative flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? 'تحديد الموقع' : 'Location Required'}
              </h2>
              <p className="text-white/80 text-sm">
                {language === 'ar' ? 'نحتاج موقعك لحساب أوقات الصلاة بدقة' : 'We need your location for accurate prayer times'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <Navigation className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                {language === 'ar' ? 'السماح بالوصول للموقع' : 'Allow Location Access'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {language === 'ar' 
                  ? 'نحتاج إلى موقعك لحساب أوقات الصلاة الدقيقة لمنطقتك الزمنية. لن نحفظ أو نشارك معلومات موقعك.'
                  : 'We need your location to calculate accurate prayer times for your timezone. We will not store or share your location data.'
                }
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={requestLocationPermission}
                disabled={locationPermission === 'checking'}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {locationPermission === 'checking' ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Navigation className="w-5 h-5" />
                    {language === 'ar' ? 'السماح بالوصول للموقع' : 'Allow Location Access'}
                  </div>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">
                    {language === 'ar' ? 'أو' : 'or'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowManualInput(true)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
              >
                {language === 'ar' ? 'إدخال الموقع يدوياً' : 'Enter Location Manually'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
                <div className="text-sm text-blue-700 dark:text-blue-300 text-left">
                  <p className="font-medium mb-1">
                    {language === 'ar' ? 'لماذا نحتاج موقعك؟' : 'Why do we need your location?'}
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li>• {language === 'ar' ? 'حساب أوقات الصلاة الدقيقة' : 'Calculate accurate prayer times'}</li>
                    <li>• {language === 'ar' ? 'تحديد المنطقة الزمنية الصحيحة' : 'Determine correct timezone'}</li>
                    <li>• {language === 'ar' ? 'تطبيق طريقة الحساب المناسبة لمنطقتك' : 'Apply appropriate calculation method for your region'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Manual Location Input Screen
  if (showManualInput) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 rounded-2xl shadow-2xl overflow-hidden",
        theme === 'ramadan' ? 'from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900 dark:via-orange-900 dark:to-yellow-900' : ''
      )}>
        <div className={cn(
          "relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800 p-6",
          theme === 'ramadan' ? 'from-amber-600 via-orange-600 to-yellow-600 dark:from-amber-800 dark:via-orange-800 dark:to-yellow-800' : ''
        )}>
          <div className="relative flex items-center gap-3 text-white">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? 'إدخال الموقع' : 'Enter Your Location'}
              </h2>
              <p className="text-white/80 text-sm">
                {language === 'ar' ? 'أدخل مدينتك ودولتك للحصول على أوقات الصلاة' : 'Enter your city and country to get prayer times'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-md mx-auto space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'المدينة' : 'City'}
                </label>
                <input
                  type="text"
                  value={manualLocation.city}
                  onChange={(e) => setManualLocation(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={language === 'ar' ? 'مثال: الرياض' : 'e.g., Riyadh'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'الدولة' : 'Country'}
                </label>
                <input
                  type="text"
                  value={manualLocation.country}
                  onChange={(e) => setManualLocation(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={language === 'ar' ? 'مثال: السعودية' : 'e.g., Saudi Arabia'}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleManualLocation}
                disabled={loading || !manualLocation.city || !manualLocation.country}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                  </div>
                ) : (
                  language === 'ar' ? 'تأكيد الموقع' : 'Confirm Location'
                )}
              </button>

              {locationPermission !== 'denied' && (
                <button
                  onClick={requestLocationPermission}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ar' 
                  ? 'سيتم استخدام موقعك فقط لحساب أوقات الصلاة ولن يتم حفظه'
                  : 'Your location will only be used for prayer time calculation and will not be stored'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={cn(
      "bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-900 rounded-2xl shadow-2xl overflow-hidden",
      theme === 'ramadan' ? 'from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900 dark:via-orange-900 dark:to-yellow-900' : ''
    )}>
      {/* Header with Islamic Pattern */}
      <div className={cn(
        "relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-800 dark:via-teal-800 dark:to-cyan-800 p-6",
        theme === 'ramadan' ? 'from-amber-600 via-orange-600 to-yellow-600 dark:from-amber-800 dark:via-orange-800 dark:to-yellow-800' : ''
      )}>
        {/* Islamic Geometric Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="islamic-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <polygon points="10,0 20,10 10,20 0,10" fill="currentColor" />
                <circle cx="10" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
          </svg>
        </div>

        <div className="relative flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {language === 'ar' ? 'أوقات الصلاة' : 'Prayer Times'}
              </h2>
              <p className="text-white/80 text-sm">
                {language === 'ar' ? 'مواقيت الصلوات الخمس' : 'Five Daily Prayer Times'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(lang => lang === 'en' ? 'ar' : 'en')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
              title={language === 'ar' ? 'تغيير اللغة' : 'Change Language'}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowManualInput(true)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
              title={language === 'ar' ? 'تغيير الموقع' : 'Change Location'}
            >
              <MapPin className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors backdrop-blur-sm"
              title={language === 'ar' ? 'الإعدادات' : 'Settings'}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Current Time and Location */}
        <div className="mb-6 text-center">
          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {format(currentTime, language === 'ar' ? 'EEEE، d MMMM yyyy' : 'EEEE, MMMM d, yyyy')}
          </div>
          {prayerData && (
            <div className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              {language === 'ar' 
                ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.ar} ${prayerData.date.hijri.year} هـ`
                : `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.en} ${prayerData.date.hijri.year} AH`
              }
            </div>
          )}
          {location && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-2">
              <MapPin className="w-4 h-4" />
              <span>
                {location.city}, {location.country}
                {locationMethod === 'manual' && (
                  <span className="ml-2 text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {language === 'ar' ? 'يدوي' : 'Manual'}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-4 text-emerald-700 dark:text-emerald-300">
              {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'طريقة الحساب' : 'Calculation Method'}
                </label>
                <select
                  value={calculationMethod}
                  onChange={(e) => setCalculationMethod(parseInt(e.target.value))}
                  className="w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {CALCULATION_METHODS.map((method) => (
                    <option key={method.id} value={method.id}>
                      {language === 'ar' ? method.nameAr : method.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={toggleNotifications}
                    className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium">
                    {language === 'ar' ? 'تفعيل التنبيهات' : 'Enable Notifications'}
                  </span>
                </label>
                <Bell className={`w-5 h-5 ${notificationsEnabled ? 'text-emerald-500' : 'text-slate-400'}`} />
              </div>
              
              <button
                onClick={refreshPrayerTimes}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {language === 'ar' ? 'تحديث الأوقات' : 'Refresh Times'}
              </button>
              
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
              >
                {language === 'ar' ? 'تغيير الموقع' : 'Change Location'}
              </button>
            </div>
          </div>
        )}

        {/* Next Prayer Highlight */}
        {nextPrayer && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
            <div className="text-center">
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                {language === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
              </div>
              <div className="flex items-center justify-center gap-3 mb-2">
                {React.createElement(PRAYER_ICONS[nextPrayer.name as keyof typeof PRAYER_ICONS], {
                  className: "w-6 h-6 text-emerald-600 dark:text-emerald-400"
                })}
                <h3 className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {PRAYER_NAMES[language][nextPrayer.name as keyof typeof PRAYER_NAMES.en]}
                </h3>
              </div>
              <div className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-1">
                {nextPrayer.time}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                {language === 'ar' ? 'خلال' : 'in'} {nextPrayer.timeRemaining}
              </div>
            </div>
          </div>
        )}

        {/* Prayer Times Grid */}
        {prayerData && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(prayerData.timings)
              .filter(([prayer]) => ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(prayer))
              .map(([prayer, time]) => {
                const IconComponent = PRAYER_ICONS[prayer as keyof typeof PRAYER_ICONS];
                const isNext = nextPrayer?.name === prayer;
                
                return (
                  <div
                    key={prayer}
                    className={cn(
                      "p-4 rounded-xl transition-all duration-200 hover:scale-105",
                      isNext 
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg transform scale-105" 
                        : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-md border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    <div className="text-center">
                      <div className="flex justify-center mb-2">
                        <IconComponent className={cn(
                          "w-6 h-6",
                          isNext ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                        )} />
                      </div>
                      <h4 className={cn(
                        "font-bold text-lg mb-1",
                        isNext ? "text-white" : "text-slate-700 dark:text-slate-300"
                      )}>
                        {PRAYER_NAMES[language][prayer as keyof typeof PRAYER_NAMES.en]}
                      </h4>
                      <p className={cn(
                        "text-xl font-bold",
                        isNext ? "text-white" : "text-emerald-600 dark:text-emerald-400"
                      )}>
                        {time}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Method Information */}
        {currentMethod && (
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>
                {language === 'ar' ? 'طريقة الحساب:' : 'Calculation Method:'} {' '}
                {language === 'ar' ? currentMethod.nameAr : currentMethod.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}