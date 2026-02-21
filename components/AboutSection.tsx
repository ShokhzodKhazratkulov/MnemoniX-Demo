
import React from 'react';
import { Search, Sparkles, Brain } from 'lucide-react';

interface AboutSectionProps {
  t: any;
}

const AboutSection: React.FC<AboutSectionProps> = ({ t }) => {
  return (
    <div className="mt-16 sm:mt-24 space-y-12 animate-fadeIn">
      <div className="text-center space-y-4">
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {t.howItWorksTitle}
        </h3>
        <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto px-4">
        {/* Step 1 */}
        <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
            <Search size={28} strokeWidth={2.5} />
          </div>
          <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3">{t.howItWorksStep1}</h4>
          <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {t.howItWorksStep1Desc}
          </p>
        </div>

        {/* Step 2 */}
        <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
          <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
            <Sparkles size={28} strokeWidth={2.5} />
          </div>
          <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3">{t.howItWorksStep2}</h4>
          <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {t.howItWorksStep2Desc}
          </p>
        </div>

        {/* Step 3 */}
        <div className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
            <Brain size={28} strokeWidth={2.5} />
          </div>
          <h4 className="text-xl font-black text-gray-900 dark:text-white mb-3">{t.howItWorksStep3}</h4>
          <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {t.howItWorksStep3Desc}
          </p>
        </div>
      </div>

      {/* Science Note */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-indigo-600 rounded-[2rem] p-8 sm:p-10 text-white shadow-xl shadow-indigo-200 dark:shadow-none overflow-hidden relative group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Sparkles size={32} />
            </div>
            <div className="text-center sm:text-left space-y-2">
              <h5 className="text-xl font-black">{t.howItWorksMethodTitle}</h5>
              <p className="text-indigo-100 font-medium leading-relaxed">
                {t.howItWorksMethodDesc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
