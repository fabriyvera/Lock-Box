"use client";

import { useState } from "react";
import { useUnsavedChanges } from "@/components/workspace/useUnsavedChanges";
import { Store } from "lucide-react";
import type { PanelProps } from "./ui";
import styles from "./seller.module.css";

export default function ProfilePanel({ state, act }: PanelProps) {
  const [profile, setProfile] = useState(state.profile);
  useUnsavedChanges(JSON.stringify(profile) !== JSON.stringify(state.profile));
  const field = (name: keyof typeof profile, value: string) =>
    setProfile((current) => ({ ...current, [name]: value }));
  return (
    <>
      <div className={styles.sectionHeading}>
        <div>
          <h2>El nombre detrás de tus productos</h2>
          <p>
            Así se presenta tu tienda en el panel y en el catálogo del live.
          </p>
        </div>
      </div>
      <section className={styles.profileCard}>
        <div className={styles.profilePreview}>
          <div className={styles.storeAvatar}>
            <Store aria-hidden="true" size={38} />
          </div>
          <h3>{profile.storeName || "Mi tienda"}</h3>
          <p>@{profile.handle || "mi_tienda"}</p>
          <span>Tienda de demostración</span>
        </div>
        <form
          className={styles.form}
          onSubmit={async (event) => {
            event.preventDefault();
            const savedProfile = {
              ...profile,
              storeName: profile.storeName.trim(),
              bio: profile.bio.trim(),
            };
            if (
              await act(
                {
                  type: "saveProfile",
                  profile: savedProfile,
                },
                "Perfil de tienda guardado.",
              )
            )
              setProfile(savedProfile);
          }}
        >
          <label>
            Nombre de tu tienda
            <input
              autoComplete="off"
              name="storeName"
              required
              minLength={2}
              maxLength={80}
              value={profile.storeName}
              onChange={(e) => field("storeName", e.target.value)}
            />
          </label>
          <div>
            <label>
              Usuario público
              <input
                autoComplete="off"
                name="handle"
                spellCheck={false}
                autoCapitalize="none"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-z0-9._]{3,30}"
                value={profile.handle}
                onChange={(e) => field("handle", e.target.value)}
              />
              <small>
                Sin @; usa minúsculas, números, puntos o guiones bajos.
              </small>
            </label>
          </div>
          <label>
            Sobre tu tienda
            <textarea
              autoComplete="off"
              name="bio"
              rows={4}
              maxLength={500}
              value={profile.bio}
              onChange={(e) => field("bio", e.target.value)}
            />
          </label>
          <button className={styles.primary}>Guardar perfil</button>
        </form>
      </section>
    </>
  );
}
