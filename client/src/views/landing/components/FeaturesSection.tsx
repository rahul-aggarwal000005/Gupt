"use client";

import { motion } from "framer-motion";
import { Key, Shield, Server } from "lucide-react";

export function FeaturesSection() {
  return (
    <section className="bg-white dark:bg-neutral-900 border-y border-slate-200/50 dark:border-neutral-800/50 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Passkey Support</h3>
            <p className="text-slate-600 dark:text-neutral-400">
              Log in securely without a password using Touch ID, Face ID, or
              Windows Hello via modern WebAuthn standards.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Zero-Knowledge Architecture</h3>
            <p className="text-slate-600 dark:text-neutral-400">
              Data is encrypted on your device using AES-256-GCM before it ever
              reaches the server. We couldn&apos;t read it even if we wanted to.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Self-Hostable</h3>
            <p className="text-slate-600 dark:text-neutral-400">
              Deploy Gupt on your own infrastructure using Docker. Keep your data
              entirely within your own network.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
