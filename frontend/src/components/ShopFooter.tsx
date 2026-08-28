"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { getSiteSettings } from "../lib/api/endpoints";

export function ShopFooter() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    getSiteSettings()
      .then((data) => setSettings(data || {}))
      .catch(() => {});
  }, []);

  const facebookUrl =
    settings["support_facebook"] ||
    settings["support_facebook_group"] ||
    "https://facebook.com";

  const instagramUrl = settings["support_instagram"] || "https://instagram.com";
  const youtubeUrl = settings["support_youtube"] || "https://youtube.com";
  const emailAddress = settings["support_email"] || "support@xoxoshop.com";
  const telegramUrl = settings["support_telegram"] || "https://t.me/xoxoshop";
  const helplineTime = settings["telegram_helpline_text"] || "Help line [9AM-12PM]";
  const helplineLabel = settings["telegram_helpline_label"] || "টেলিগ্রাম সাপোর্ট";
  const appDownloadUrl = settings["app_download_url"] || "#";

  return (
    <footer className="bg-gradient-to-br from-primary-600 to-primary-900 text-white pt-16 pb-28 md:pb-8 mt-16 relative overflow-hidden shadow-inner">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 opacity-70"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 -left-12 w-48 h-48 bg-purple-900/30 rounded-full blur-2xl"></div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 text-center md:text-left">
          {/* Social Links */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="font-bold text-sm mb-6 uppercase tracking-widest text-purple-200 drop-shadow-sm">
              Stay Connected
            </h3>
            <div className="flex items-center gap-3">
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer backdrop-blur-sm"
              >
                <FaFacebook size={18} className="text-white" />
              </a>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer backdrop-blur-sm"
              >
                <FaInstagram size={18} className="text-white" />
              </a>

              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer backdrop-blur-sm"
              >
                <FaYoutube size={18} className="text-white" />
              </a>

              <a
                href={`mailto:${emailAddress}`}
                aria-label="Email Support"
                className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer backdrop-blur-sm"
              >
                <Mail size={18} className="text-white" />
              </a>
            </div>
          </div>

          {/* Mobile App */}
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-sm mb-6 uppercase tracking-widest text-purple-200 drop-shadow-sm">
              Our Mobile App
            </h3>
            <a
              href={appDownloadUrl}
              target={appDownloadUrl !== "#" ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="hover:scale-110 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all cursor-pointer inline-block"
            >
              <img
                src="/FF/google-play.nDtcExnl.png"
                alt="Get it on Google Play"
                className="w-[150px] object-contain"
              />
            </a>
          </div>

          {/* Telegram Support Helpline Button */}
          <div className="flex flex-col items-center md:items-end">
            <h3 className="font-bold text-sm mb-6 uppercase tracking-widest text-purple-200 drop-shadow-sm">
              Support Center
            </h3>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3 w-[240px] backdrop-blur-sm hover:bg-white/20 hover:scale-105 transition-all shadow-lg cursor-pointer group"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                <Send size={18} className="ml-0.5" />
              </div>
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[11px] text-purple-200 font-medium truncate">
                  {helplineTime}
                </span>
                <span className="text-sm font-bold text-white mt-0.5 tracking-wide truncate">
                  {helplineLabel}
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-primary-400/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[12px] text-primary-200 font-medium">
          <div className="flex items-center gap-2">
            <img
              src="/xoxo_logo.png"
              alt="XoXo Shop"
              className="h-6 w-auto object-contain brightness-0 invert"
            />
            <span>
              &copy; {new Date().getFullYear()}{" "}
              <strong className="text-white">{settings["site_title"] || "XoXo Shop"}</strong>. All Rights
              Reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-purple-200">
            <span>100% Secure Checkout</span>
            <span>•</span>
            <span>Instant Automated Top-Up</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
