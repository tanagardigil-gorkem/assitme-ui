"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMorningDashboard } from "@/hooks/use-morning-dashboard";

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return `Good Morning, ${name}!`;
  } else if (hour < 18) {
    return `Good Afternoon, ${name}!`;
  } else if (hour < 22) {
    return `Good Evening, ${name}!`;
  } else {
    return `Good Night, ${name}!`;
  }
}

export default function Home() {
  const { data, loading, error } = useMorningDashboard(3);

  const greeting = getGreeting("Gorkem");

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
        <span className="material-symbols-outlined text-4xl">error</span>
        <p className="font-bold">Failed to load morning updates</p>
        <p className="text-sm">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <Card className="glass-panel soft-diffused p-8 rounded-soft flex flex-col md:flex-row md:justify-between md:items-center gap-6 border-none">
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <h2 className="text-charcoal font-friendly text-5xl font-extrabold tracking-tight">
            {greeting}
          </h2>
          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className="bg-[#FEF3C7]/60 text-[#D97706] px-5 py-2 rounded-full border-none hover:bg-[#FEF3C7]/80 h-10 transition-colors"
            >
              <span className="material-symbols-outlined text-[#F59E0B] text-xl fill-1 mr-2">
                {loading ? "sync" : "light_mode"}
              </span>
              <span className="text-xs font-bold uppercase tracking-wide">
                {loading
                  ? "Loading..."
                  : data?.weather?.current?.temp_c !== undefined
                    ? `${data.weather.current.temp_c}°C & ${data.weather.current.condition_text ?? "Sunny"}`
                    : "Weather Unavailable"}
              </span>
            </Badge>
            <p className="text-[#64748B] text-sm font-semibold tracking-tight">
              {loading
                ? "Hang tight, personalizing your day..."
                : data?.mood?.affirmation || "Let's make today absolutely wonderful."}
            </p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md px-6 py-4 rounded-[24px] shadow-sm md:max-w-[360px] w-full md:w-auto relative overflow-hidden group border border-white/40 md:self-center shrink-0">
          <div className="absolute -right-1 -top-2 opacity-[0.08] group-hover:rotate-6 transition-transform">
            <span className="material-symbols-outlined text-8xl text-salmon font-light">
              format_quote
            </span>
          </div>
          <div className="flex gap-4 items-center relative z-10">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              <span className="material-symbols-outlined text-salmon text-2xl fill-1">
                auto_awesome
              </span>
            </div>
            <p className="text-slate-600 text-[13px] font-semibold italic leading-relaxed pr-4">
              {loading
                ? "Getting your morning focus..."
                : `"${data?.mood?.affirmation ?? "Focus on what brings you joy today."}"`}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Happiness",
            value: "High ✨",
            progress: "85%",
            gradient: "from-teal-400 to-accent",
          },
          {
            label: "Daily Tasks",
            value: "12 Left",
            badge: "4 Done",
            icon: "task_alt",
            badgeColor: "bg-teal-50 text-teal-600",
          },
          {
            label: "Focus Zone",
            value: "85%",
            badge: "Peak",
            icon: "trending_up",
            badgeColor: "bg-indigo-50 text-indigo-500",
          },
          {
            label: "Environment",
            value: "Optimal",
            icon: "filter_vintage",
            iconColor: "text-teal-400",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="glass-panel soft-diffused p-5 rounded-soft border-none"
          >
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1.5">
              {stat.label}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-charcoal text-2xl font-black">{stat.value}</p>
              {stat.progress ? (
                <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden self-center">
                  <div
                    className={`bg-gradient-to-r ${stat.gradient} h-full w-[85%]`}
                  ></div>
                </div>
              ) : stat.badge ? (
                <Badge
                  className={`${stat.badgeColor} text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full border-none hover:${stat.badgeColor}`}
                >
                  <span className="material-symbols-outlined text-[10px]">
                    {stat.icon}
                  </span>{" "}
                  {stat.badge}
                </Badge>
              ) : (
                <span
                  className={`material-symbols-outlined ${stat.iconColor} text-2xl`}
                >
                  {stat.icon}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generated Day */}
        <Card className="glass-panel soft-diffused p-6 rounded-soft flex flex-col border-none">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-charcoal text-xl font-extrabold">
                Generated Day
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                AI-Optimized Schedule
              </p>
            </div>
            <Badge className="bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full text-[9px] font-black uppercase shadow-sm border-none hover:bg-indigo-50">
              Best Flow Detected
            </Badge>
          </div>
          <div className="space-y-5 flex-1">
            {[
              {
                time: "Coffee & AI Briefing",
                icon: "coffee",
                type: "AI Briefing",
                color: "text-orange-400",
                bg: "bg-white/60",
                desc: "Summary of 14 emails and 3 curated news updates.",
              },
              {
                time: "Project Focus: Design Sprint",
                icon: "psychology",
                type: "High Energy",
                color: "text-teal-600",
                bg: "bg-teal-100/60",
                desc: "Deep work block. Auto-silencing notifications.",
                special: true,
              },
              {
                time: "School Pickup",
                icon: "directions_car",
                type: "03:00 PM",
                color: "text-indigo-400",
                bg: "bg-white/60",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 group">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <span
                      className={`material-symbols-outlined ${item.color} text-xl`}
                    >
                      {item.icon}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-slate-200 to-transparent my-1"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`${item.special ? "bg-teal-50/40 border border-teal-100/50" : "bg-white/50"} p-4 rounded-inner shadow-sm hover:shadow-md transition-all`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-charcoal text-sm font-bold">
                        {item.time}
                      </p>
                      <Badge
                        className={`px-2 py-0.5 ${item.special ? "bg-teal-500" : item.type.includes(":") ? "bg-transparent text-slate-400" : "bg-salmon"} text-white text-[9px] font-black rounded-full uppercase border-none hover:opacity-90`}
                      >
                        {item.type}
                      </Badge>
                    </div>
                    {item.desc && (
                      <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pulse */}
        <Card className="glass-panel soft-diffused rounded-soft flex flex-col border-none p-0 overflow-hidden">
          <div className="p-5 border-b border-white/20 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-charcoal">Pulse</h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Real-time Information
              </p>
            </div>
            <span className="material-symbols-outlined text-indigo-400">
              rss_feed
            </span>
          </div>
          <div className="p-6 flex flex-col gap-6 flex-1">
            {loading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex flex-col gap-2">
                    <div className="h-2 w-16 bg-slate-200 rounded"></div>
                    <div className="h-4 w-full bg-slate-200 rounded"></div>
                    <div className="h-2 w-24 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : data?.news && data.news.length > 0 ? (
              data.news.map((item, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1.5 ${i < data.news.length - 1 ? "border-b border-white/20 pb-4" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                      {item.source}
                    </p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold leading-snug text-slate-700 hover:text-indigo-600 transition-colors"
                  >
                    {item.headline}
                  </a>
                  {item.summary && (
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                  {item.published_at && (
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(item.published_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">
                No news items available right now.
              </p>
            )}
            <Button
              variant="secondary"
              className="w-full py-6 bg-white/60 shadow-sm rounded-inner text-[11px] font-black text-charcoal hover:bg-white hover:shadow-md transition-all flex items-center justify-center gap-2 mt-auto border-none"
            >
              READ MORE{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-pink-100/50 to-teal-100/50 p-6 rounded-soft shadow-lg relative overflow-hidden flex items-center border-none">
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <span className="material-symbols-outlined text-[120px] text-teal-400">
              nature_people
            </span>
          </div>
          <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-white/80 rounded-xl shadow-sm">
                  <span className="material-symbols-outlined text-salmon text-lg fill-1">
                    spa
                  </span>
                </div>
                <h4 className="font-black text-[10px] uppercase tracking-wider text-salmon">
                  Mindful Break
                </h4>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-700">
                Gorkem, AI suggests a 15-minute walk at 11:00 AM to maintain your
                peak energy levels.
              </p>
            </div>
            <Button className="flex-shrink-0 px-8 py-6 bg-white shadow-lg shadow-pink-200/20 text-charcoal text-[11px] font-black rounded-inner hover:scale-[1.02] transition-transform border-none hover:bg-white">
              ADD TO SCHEDULE
            </Button>
          </div>
        </Card>

        <Card className="glass-panel soft-diffused p-6 rounded-soft border-none">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-extrabold text-charcoal">Family</h3>
            <Badge className="text-[9px] font-bold text-teal-600 px-3 py-1 bg-teal-50 rounded-full uppercase shadow-sm border-none hover:bg-teal-50">
              All Safe
            </Badge>
          </div>
          <div className="space-y-4">
            {[
              {
                name: "Sarah",
                status: "At Gym • Back 8:30",
                initial: "SJ",
                bg: "bg-blue-100",
                text: "text-blue-500",
                icon: "location_on",
                fill: true,
              },
              {
                name: "Max",
                status: "At School • Soccer 4PM",
                initial: "MJ",
                bg: "bg-orange-100",
                text: "text-orange-500",
                icon: "notifications",
                fill: false,
              },
            ].map((member, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 bg-white/50 rounded-inner shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar className={`w-9 h-9 border-2 border-white shadow-sm`}>
                    <AvatarFallback
                      className={`${member.bg} ${member.text} text-[10px] font-black`}
                    >
                      {member.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[12px] font-bold text-charcoal">
                      {member.name}
                    </p>
                    <p className="text-[9px] text-slate-500 font-medium">
                      {member.status}
                    </p>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined ${member.text} text-sm ${member.fill ? "fill-1" : ""}`}
                >
                  {member.icon}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
