"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateMemoir } from "@/features/memoir/hooks";
import type {
  RelationshipGroup,
  WizardFormValues,
} from "@/features/memoir/schemas";
import { isApiError } from "@/lib/api/errors";
import { createClient } from "@/lib/supabase/client";
import {
  clearPendingOnboarding,
  loadPendingOnboarding,
  savePendingOnboarding,
  type PendingOnboarding,
} from "@/features/memoir/pending-store";

const RELATIONS: { label: string; value: RelationshipGroup }[] = [
  { label: "Parent", value: "parent" },
  { label: "GrandParent", value: "grandchild" },
  { label: "Friend", value: "friend" },
  { label: "Sibling", value: "sibling" },
  { label: "Spouse", value: "spouse_partner" },
  { label: "Other", value: "other" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const create = useCreateMemoir();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<1 | 2>(1);
  const [relationship, setRelationship] =
    useState<RelationshipGroup | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pendingCreate, setPendingCreate] =
    useState<PendingOnboarding | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const autoCreateAttemptedRef = useRef(false);

  const { register, handleSubmit, watch, setValue } =
    useForm<WizardFormValues>({
      mode: "onChange",
      defaultValues: {
        relationship: null,
        subject_name: "",
        birth_year: "",
        is_living: true,
        end_year: "",
      },
    });

  const isLiving = watch("is_living");
  const subjectName = watch("subject_name");

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const pending = loadPendingOnboarding();

      if (pending) {
        setRelationship(pending.relationship);
        setStep(2);
        setValue("relationship", pending.relationship);
        setValue("subject_name", pending.subject_name);
        setValue("birth_year", pending.birth_year);
        setValue("is_living", pending.is_living);
        setValue("end_year", pending.end_year);
      }

      let userExists = false;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userExists = Boolean(user);
      } catch {
        userExists = false;
      }

      if (cancelled) return;

      setAuthenticated(userExists);
      if (userExists && pending) {
        setPendingCreate(pending);
      }
      setHydrated(true);
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [setValue, supabase]);

  const createWorkspace = useCallback(
    async (data: PendingOnboarding) => {
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setCreateError(null);

      try {
        const memoir = await create.mutateAsync({
          relationship: data.relationship,
          subject_name: data.subject_name,
          is_living: data.is_living,
          birth_year: data.birth_year
            ? Number.parseInt(data.birth_year, 10)
            : null,
          end_year:
            !data.is_living && data.end_year
              ? Number.parseInt(data.end_year, 10)
              : null,
        });

        clearPendingOnboarding();
        setPendingCreate(null);
        router.push(`/dashboard/${memoir.id}`);
      } catch (error) {
        setCreateError(
          isApiError(error)
            ? error.message
            : "Unable to create the memoir. Please try again.",
        );
      } finally {
        inFlightRef.current = false;
      }
    },
    [create, router],
  );

  useEffect(() => {
    if (
      !hydrated ||
      !authenticated ||
      !pendingCreate ||
      autoCreateAttemptedRef.current
    ) {
      return;
    }

    autoCreateAttemptedRef.current = true;
    void createWorkspace(pendingCreate);
  }, [authenticated, createWorkspace, hydrated, pendingCreate]);

  async function onSubmit(data: WizardFormValues) {
    if (!relationship) return;

    const pending: PendingOnboarding = {
      relationship,
      subject_name: data.subject_name.trim(),
      birth_year: data.birth_year,
      is_living: data.is_living,
      end_year: data.end_year,
    };

    let userExists = false;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userExists = Boolean(user);
    } catch {
      userExists = false;
    }

    if (!userExists) {
      savePendingOnboarding(pending);
      router.push("/login");
      return;
    }

    setAuthenticated(true);
    await createWorkspace(pending);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-12 flex items-center justify-center gap-4">
        <div
          className={`flex size-10 items-center justify-center rounded-full font-heading text-lg ${
            step === 1
              ? "bg-amber-950 text-amber-50"
              : "bg-amber-900/10 text-amber-900"
          }`}
        >
          1
        </div>
        <div className="h-px w-16 bg-amber-900/20" />
        <div
          className={`flex size-10 items-center justify-center rounded-full font-heading text-lg ${
            step === 2
              ? "bg-amber-950 text-amber-50"
              : "bg-amber-900/10 text-amber-900"
          }`}
        >
          2
        </div>
      </div>

      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 text-center">
          <div className="space-y-2">
            <h1 className="font-heading text-4xl text-amber-950">
              Who is this memoir for?
            </h1>
            <p className="text-amber-900/70">
              Select the relationship with the person you want to preserve memories
            </p>
          </div>

          <div className="mx-auto grid max-w-xl grid-cols-2 gap-4 md:grid-cols-3">
            {RELATIONS.map((rel) => (
              <button
                key={rel.value}
                type="button"
                onClick={() => {
                  setRelationship(rel.value);
                  setValue("relationship", rel.value);
                }}
                className={`rounded-xl border py-8 text-lg font-medium transition-all ${
                  relationship === rel.value
                    ? "border-amber-950 bg-amber-50 text-amber-950 shadow-sm"
                    : "border-amber-900/10 bg-white text-amber-900/70 hover:border-amber-900/30 hover:bg-amber-50"
                }`}
              >
                {rel.label}
              </button>
            ))}
          </div>

          <Button
            size="lg"
            className="w-48 rounded-full bg-[#65402A]"
            disabled={!relationship}
            onClick={() => setStep(2)}
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="animate-in fade-in slide-in-from-bottom-4 space-y-10"
        >
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <Label className="font-heading text-2xl text-amber-950">
                Enter their name
              </Label>
              <Input
                {...register("subject_name", { required: true })}
                placeholder="Enter their name"
                className="h-14 rounded-xl border-amber-900/30 bg-white text-lg"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-heading text-2xl text-amber-950">
                Date of birth
              </Label>
              <Input
                {...register("birth_year")}
                type="number"
                min={1800}
                max={2100}
                placeholder="Enter year"
                className="h-14 rounded-xl border-amber-900/30 bg-white text-center text-lg"
              />
            </div>

            <div className="space-y-3">
              <Label className="font-heading text-2xl text-amber-950">
                Story / Lifespan Until:
              </Label>
              <div className="space-y-4 rounded-xl border border-amber-900/10 bg-white p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    className="size-5 accent-[#65402A]"
                    checked={isLiving}
                    onChange={() => setValue("is_living", true)}
                  />
                  <span className="font-medium text-amber-950">Present / Ongoing</span>
                </label>

                <label className="flex cursor-pointer flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      className="size-5 accent-[#65402A]"
                      checked={!isLiving}
                      onChange={() => setValue("is_living", false)}
                    />
                    <span
                      className={`font-medium ${
                        !isLiving ? "text-amber-950" : "text-amber-900/40"
                      }`}
                    >
                      Specific Date
                    </span>
                  </div>

                  {!isLiving && (
                    <Input
                      {...register("end_year")}
                      type="number"
                      min={1800}
                      max={2100}
                      placeholder="Enter year"
                      className="h-12 rounded-lg border-amber-900/30 bg-amber-50 text-center"
                    />
                  )}
                </label>
              </div>
            </div>
          </div>

          {createError && (
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              {createError}
            </div>
          )}

          {authenticated && pendingCreate && !createError && (
            <p className="text-center text-sm text-amber-900/70">
              Your account is ready. Creating your memoir workspace…
            </p>
          )}

          <div className="flex justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="rounded-full"
              onClick={() => setStep(1)}
              disabled={create.isPending}
            >
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              className="rounded-full bg-[#65402A]"
              disabled={
                !subjectName.trim() ||
                create.isPending ||
                !hydrated
              }
            >
              {create.isPending ? "Creating..." : "Create Workspace"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
