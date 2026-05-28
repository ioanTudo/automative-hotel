"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { roomSchema, type RoomInput } from "@/lib/validations";
import {
  createRoomAction,
  deleteRoomAction,
  updateRoomAction,
} from "@/lib/actions/admin";
import { Field, inputClasses } from "@/components/ui/Field";
import { buttonClasses, cn } from "@/lib/ui";
import { formatCurrency } from "@/lib/booking-utils";
import type { RoomView } from "@/lib/queries";

export function RoomManager({ rooms }: { rooms: RoomView[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<RoomView | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(room: RoomView) {
    if (!window.confirm(`Delete "${room.name}"? This also removes its bookings.`)) return;
    setDeletingId(room.id);
    const res = await deleteRoomAction({ roomId: room.id });
    setDeletingId(null);
    if (res.ok) router.refresh();
    else window.alert(res.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Rooms ({rooms.length})</h2>
        {editing === null ? (
          <button onClick={() => setEditing("new")} className={buttonClasses("primary", "sm")}>
            Add room
          </button>
        ) : null}
      </div>

      {editing !== null ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <h3 className="mb-4 font-semibold text-stone-900">
            {editing === "new" ? "New room" : `Edit · ${editing.name}`}
          </h3>
          <RoomForm
            room={editing === "new" ? undefined : editing}
            onDone={() => {
              setEditing(null);
              router.refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Room</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Sleeps</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-900">{room.name}</p>
                  <p className="text-xs text-stone-400">/{room.slug}</p>
                </td>
                <td className="px-4 py-3 text-stone-700">{formatCurrency(room.pricePerNight)}</td>
                <td className="px-4 py-3 text-stone-700">{room.capacity}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      room.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-600",
                    )}
                  >
                    {room.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(room)} className={buttonClasses("secondary", "sm")}>
                      Edit
                    </button>
                    <button
                      onClick={() => remove(room)}
                      disabled={deletingId === room.id}
                      className={buttonClasses("danger", "sm")}
                    >
                      {deletingId === room.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No rooms yet. Add your first room above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoomForm({
  room,
  onDone,
  onCancel,
}: {
  room?: RoomView;
  onDone: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room?.name ?? "",
      slug: room?.slug ?? "",
      description: room?.description ?? "",
      pricePerNight: room?.pricePerNight ?? 80,
      capacity: room?.capacity ?? 2,
      amenities: room?.amenities.join(", ") ?? "",
      imageUrl: room?.imageUrl ?? "/images/rooms/custom.svg",
      isActive: room?.isActive ?? true,
    },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const res = room
      ? await updateRoomAction({ ...data, id: room.id })
      : await createRoomAction(data);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          if (key === "_form") continue;
          setError(key as keyof RoomInput, { message });
        }
      }
      return;
    }
    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="rm-name" error={errors.name?.message}>
          <input id="rm-name" {...register("name")} className={inputClasses} />
        </Field>
        <Field label="Slug" htmlFor="rm-slug" error={errors.slug?.message} hint="lowercase-with-hyphens">
          <input id="rm-slug" {...register("slug")} className={inputClasses} />
        </Field>
        <Field label="Price / night (EUR)" htmlFor="rm-price" error={errors.pricePerNight?.message}>
          <input
            id="rm-price"
            type="number"
            step="0.01"
            min={0}
            {...register("pricePerNight", { valueAsNumber: true })}
            className={inputClasses}
          />
        </Field>
        <Field label="Capacity" htmlFor="rm-cap" error={errors.capacity?.message}>
          <input
            id="rm-cap"
            type="number"
            min={1}
            {...register("capacity", { valueAsNumber: true })}
            className={inputClasses}
          />
        </Field>
        <Field label="Image URL / path" htmlFor="rm-img" error={errors.imageUrl?.message} className="sm:col-span-2">
          <input id="rm-img" {...register("imageUrl")} className={inputClasses} />
        </Field>
        <Field
          label="Amenities"
          htmlFor="rm-amen"
          error={errors.amenities?.message}
          hint="Comma-separated, e.g. Free Wi-Fi, Smart TV, Mini-bar"
          className="sm:col-span-2"
        >
          <input id="rm-amen" {...register("amenities")} className={inputClasses} />
        </Field>
        <Field label="Description" htmlFor="rm-desc" error={errors.description?.message} className="sm:col-span-2">
          <textarea
            id="rm-desc"
            rows={3}
            {...register("description")}
            className={cn(inputClasses, "resize-none")}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" {...register("isActive")} className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500" />
        Active (visible to guests)
      </label>

      <div className="flex gap-3">
        <button type="submit" disabled={isSubmitting} className={buttonClasses("primary", "md")}>
          {isSubmitting ? "Saving…" : room ? "Save changes" : "Create room"}
        </button>
        <button type="button" onClick={onCancel} className={buttonClasses("secondary", "md")}>
          Cancel
        </button>
      </div>
    </form>
  );
}
