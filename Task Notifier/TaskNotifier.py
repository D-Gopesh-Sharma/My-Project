import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
from datetime import datetime
import time
import threading
import os
import base64
import tempfile
from PIL import Image
import winsound
import platform
import colorsys
import math

# Optional notification libraries with fallbacks
try:
    from win10toast import ToastNotifier
    from winotify import Notification
    WINDOWS_NOTIFICATIONS_AVAILABLE = True
except Exception:
    WINDOWS_NOTIFICATIONS_AVAILABLE = False
    ToastNotifier = None  # type: ignore
    Notification = None  # type: ignore

try:
    from plyer import notification as plyer_notification
    PLYER_AVAILABLE = True
except Exception:
    PLYER_AVAILABLE = False
    plyer_notification = None  # type: ignore

try:
    import pystray
    PYSTRAY_AVAILABLE = True
except Exception:
    PYSTRAY_AVAILABLE = False
    pystray = None  # type: ignore


THEMES = {
    "Light Blue": {
        "hue": 0.58,
        "sat": 0.28,
        "val_min": 0.90,
        "val_max": 0.98,
        "button_base": "#4A90E2",
        "button_hover": "#5AA0F2",
        "button_active": "#3A78C6",
        "fg": "#0f1a2a",
    },
    "Dark Blue": {
        "hue": 0.62,
        "sat": 0.40,
        "val_min": 0.12,
        "val_max": 0.28,
        "button_base": "#2E3A8C",
        "button_hover": "#3947A8",
        "button_active": "#232E70",
        "fg": "#E7EDF7",
    },
    "Black": {
        "hue": 0.00,
        "sat": 0.00,
        "val_min": 0.06,
        "val_max": 0.18,
        "button_base": "#2B2B2B",
        "button_hover": "#3A3A3A",
        "button_active": "#202020",
        "fg": "#EFEFEF",
    },
    "White": {
        "hue": 0.00,
        "sat": 0.00,
        "val_min": 0.95,
        "val_max": 1.00,
        "button_base": "#E0E0E0",
        "button_hover": "#EAEAEA",
        "button_active": "#D5D5D5",
        "fg": "#0F0F0F",
    },
}


class RoundedAnimatedButton(tk.Canvas):
    def __init__(self, master, text, command=None, width=120, height=40, radius=14, base="#6C63FF", hover="#807AFF", active="#544BFF"):
        try:
            parent_bg = master.cget("background")
            if not parent_bg:
                raise Exception()
        except Exception:
            try:
                parent_bg = master.winfo_toplevel().cget("background")
            except Exception:
                parent_bg = "SystemButtonFace"
        super().__init__(master, width=width, height=height, highlightthickness=0, bd=0, bg=parent_bg)
        self.cmd = command
        self.radius = radius
        self.base = base
        self.hover = hover
        self.active = active
        self._state = "base"
        self._pulse_phase = 0.0
        self.text = text
        self._draw()
        self.bind("<Enter>", self._on_enter)
        self.bind("<Leave>", self._on_leave)
        self.bind("<Button-1>", self._on_click)
        self.bind("<ButtonRelease-1>", self._on_release)
        self.after(60, self._pulse)

    def _rounded_rect(self, x0, y0, x1, y1, r, fill):
        self.create_rectangle(x0 + r, y0, x1 - r, y1, fill=fill, outline="")
        self.create_rectangle(x0, y0 + r, x1, y1 - r, fill=fill, outline="")
        self.create_oval(x0, y0, x0 + 2 * r, y0 + 2 * r, fill=fill, outline="")
        self.create_oval(x1 - 2 * r, y0, x1, y0 + 2 * r, fill=fill, outline="")
        self.create_oval(x0, y1 - 2 * r, x0 + 2 * r, y1, fill=fill, outline="")
        self.create_oval(x1 - 2 * r, y1 - 2 * r, x1, y1, fill=fill, outline="")

    def _draw(self):
        self.delete("all")
        w = int(self["width"]) if isinstance(self["width"], str) else self["width"]
        h = int(self["height"]) if isinstance(self["height"], str) else self["height"]
        color = self.base if self._state == "base" else (self.hover if self._state == "hover" else self.active)
        self._rounded_rect(2, 2, w - 2, h - 2, self.radius, color)
        self.create_text(w // 2, h // 2, text=self.text, fill="#FFFFFF", font=("Segoe UI", 10, "bold"))

    def _on_enter(self, _):
        self._state = "hover"
        self._draw()

    def _on_leave(self, _):
        self._state = "base"
        self._draw()

    def _on_click(self, _):
        self._state = "active"
        self._draw()

    def _on_release(self, _):
        self._state = "hover"
        self._draw()
        if self.cmd:
            self.cmd()

    def _pulse(self):
        try:
            if self._state == "hover":
                self._pulse_phase = (self._pulse_phase + 0.12) % (2 * math.pi)
                self.scale("all", 0, 0, 1.0 + 0.006 * math.sin(self._pulse_phase), 1.0 + 0.006 * math.sin(self._pulse_phase))
        finally:
            self.after(80, self._pulse)


class NotifierApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Task & Reminder Notifier")
        self.root.geometry("900x560")
        self.root.minsize(860, 520)

        # Modern style
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass

        # Animated gradient background
        self.bg_canvas = tk.Canvas(self.root, highlightthickness=0, bd=0)
        self.bg_canvas.place(relx=0, rely=0, relwidth=1, relheight=1)
        self.bg_bands = []
        self.bg_hue = 0.65
        self.bg_sat = 0.35
        self.bg_val_min = 0.20
        self.bg_val_max = 0.60
        # Initialize theme-related defaults BEFORE drawing blobs
        self.current_theme_name = "Light Blue"
        self.night_mode_var = tk.BooleanVar(value=False)
        _t = THEMES.get(self.current_theme_name, THEMES["Light Blue"])
        self.button_base = _t["button_base"]
        self.button_hover = _t["button_hover"]
        self.button_active = _t["button_active"]
        self.bg_blobs = []
        self.root.bind("<Configure>", self._on_resize)
        self._init_gradient()
        self._init_blobs()
        self._animate_background()

        # Foreground container
        self.container = ttk.Frame(self.root, padding=12)
        self.container.place(relx=0, rely=0, relwidth=1, relheight=1)

        # Assets
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.assets_dir = os.path.join(self.base_dir, "assets")
        self.default_icon = self._first_existing([
            os.path.join(self.assets_dir, "app.ico"),
            os.path.join(self.base_dir, "app.ico"),
        ])
        self.default_sound = self._first_existing([
            os.path.join(self.assets_dir, "notification.wav"),
            os.path.join(self.base_dir, "notification.wav"),
        ])
        if self.default_icon:
            try:
                self.root.iconbitmap(self.default_icon)
            except Exception:
                pass

        # Session state
        self.icon_path = self.default_icon
        self.image_path = None
        self.sound_path = None

        # Windows toasters
        self.toaster = None
        if os.name == 'nt' and WINDOWS_NOTIFICATIONS_AVAILABLE and ToastNotifier is not None:
            try:
                self.toaster = ToastNotifier()
            except Exception:
                self.toaster = None

        # Data
        self.notifications = self.load_notifications()

        # Layout: settings bar, left form, right list
        self.settings_bar = ttk.Frame(self.container)
        self.settings_bar.pack(side=tk.TOP, fill=tk.X, pady=(0, 8))
        ttk.Label(self.settings_bar, text="Theme").pack(side=tk.LEFT)
        self.theme_var = tk.StringVar(value="Light Blue")
        self.theme_combo = ttk.Combobox(self.settings_bar, textvariable=self.theme_var, state="readonly", values=list(THEMES.keys()), width=14)
        self.theme_combo.pack(side=tk.LEFT, padx=(6, 12))
        self.theme_combo.bind("<<ComboboxSelected>>", self._on_theme_change)

        self.night_mode_var = tk.BooleanVar(value=False)
        self.night_check = ttk.Checkbutton(self.settings_bar, text="Night Mode", variable=self.night_mode_var, command=self._apply_theme)
        self.night_check.pack(side=tk.LEFT, padx=(0, 12))

        self.run_bg_var = tk.BooleanVar(value=True)
        self.run_bg_check = ttk.Checkbutton(self.settings_bar, text="Run in background on close", variable=self.run_bg_var)
        self.run_bg_check.pack(side=tk.LEFT)

        self.left = ttk.Frame(self.container)
        self.left.pack(side=tk.LEFT, fill=tk.BOTH, expand=False, padx=(0, 10))
        self.right = ttk.Frame(self.container)
        self.right.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        self._build_form()
        self._build_list()

        # Scheduler
        self.checker_thread = threading.Thread(target=self.check_notifications, daemon=True)
        self.checker_thread.start()

        self._apply_theme()
        # Ensure focus assist doesn't hide toasts silently
        print("[Notifier] App started. Scheduler running. Create a Daily reminder one minute ahead and keep the app open.")
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    # ---------- Animated background ----------
    def _on_resize(self, _event):
        self._init_gradient()

    def _init_gradient(self):
        self.bg_canvas.delete("all")
        self.bg_bands.clear()
        w = max(self.bg_canvas.winfo_width(), 1)
        h = max(self.bg_canvas.winfo_height(), 1)
        bands = 48
        band_w = max(int(w / bands) + 1, 2)
        for i in range(bands):
            x0 = i * band_w
            x1 = x0 + band_w + 1
            rid = self.bg_canvas.create_rectangle(x0, 0, x1, h, outline="", fill="#000000")
            self.bg_bands.append(rid)

    def _init_blobs(self):
        self.bg_blobs = []
        w = max(self.bg_canvas.winfo_width(), 1)
        h = max(self.bg_canvas.winfo_height(), 1)
        for i in range(6):
            bx = (i + 1) * (w // 7)
            by = (i % 3 + 1) * (h // 4)
            r = 40 + (i % 3) * 18
            color = "#ffffff" if self.night_mode_var.get() else "#000000"
            alpha = 0.06 if self.night_mode_var.get() else 0.08
            cid = self.bg_canvas.create_oval(bx - r, by - r, bx + r, by + r, outline="", fill=color, stipple="gray25")
            self.bg_blobs.append({"id": cid, "x": bx, "y": by, "r": r, "vx": 0.6 + 0.2 * (i % 3), "vy": 0.4 + 0.2 * (i % 2)})

    def _animate_background(self):
        try:
            w = max(self.bg_canvas.winfo_width(), 1)
            h = max(self.bg_canvas.winfo_height(), 1)
            bands = len(self.bg_bands)
            self.bg_hue = (self.bg_hue + 0.0025) % 1.0
            for i, rid in enumerate(self.bg_bands):
                hue = (self.bg_hue + i / max(bands, 1)) % 1.0 if self.current_theme_name not in ("Black", "White") else self.bg_hue
                sat = self.bg_sat
                val = self.bg_val_min + (self.bg_val_max - self.bg_val_min) * (i / max(bands - 1, 1))
                r, g, b = colorsys.hsv_to_rgb(hue, sat, val)
                color = f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"
                self.bg_canvas.itemconfig(rid, fill=color)
                self.bg_canvas.coords(rid, i * (w / max(bands, 1)), 0, (i + 1) * (w / max(bands, 1)) + 1, h)

            for blob in self.bg_blobs:
                blob["x"] += blob["vx"]
                blob["y"] += blob["vy"]
                if blob["x"] - blob["r"] < 0 or blob["x"] + blob["r"] > w:
                    blob["vx"] *= -1
                if blob["y"] - blob["r"] < 0 or blob["y"] + blob["r"] > h:
                    blob["vy"] *= -1
                self.bg_canvas.coords(blob["id"], blob["x"] - blob["r"], blob["y"] - blob["r"], blob["x"] + blob["r"], blob["y"] + blob["r"]) 
        finally:
            self.root.after(30, self._animate_background)

    def _on_theme_change(self, _evt=None):
        self._apply_theme()

    def _apply_theme(self):
        self.current_theme_name = self.theme_var.get()
        theme = THEMES.get(self.current_theme_name, THEMES["Light Blue"])
        if self.night_mode_var.get():
            theme = THEMES.get("Dark Blue") if self.current_theme_name in ("Light Blue", "White") else THEMES.get(self.current_theme_name, THEMES["Dark Blue"])

        self.bg_hue = theme["hue"]
        self.bg_sat = theme["sat"]
        self.bg_val_min = theme["val_min"]
        self.bg_val_max = theme["val_max"]
        self.fg_color = theme["fg"]
        self.button_base = theme["button_base"]
        self.button_hover = theme["button_hover"]
        self.button_active = theme["button_active"]
        try:
            self.container.configure()
        except Exception:
            pass
        self._init_blobs()

    # ---------- UI ----------
    def _build_form(self):
        form = ttk.LabelFrame(self.left, text="Create / Edit Notification", padding=12)
        form.pack(fill=tk.BOTH, expand=False)

        row = 0
        ttk.Label(form, text="Title").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.title_var = tk.StringVar()
        ttk.Entry(form, textvariable=self.title_var, width=32).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=4)

        row += 1
        ttk.Label(form, text="Message").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.message_var = tk.StringVar()
        ttk.Entry(form, textvariable=self.message_var, width=32).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=4)

        row += 1
        ttk.Label(form, text="Date (YYYY-MM-DD)").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.date_var = tk.StringVar()
        ttk.Entry(form, textvariable=self.date_var, width=20).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=4)

        row += 1
        ttk.Label(form, text="Time").grid(row=row, column=0, sticky=tk.W, pady=4)
        time_row = ttk.Frame(form)
        time_row.grid(row=row, column=1, sticky=(tk.W, tk.E))
        self.time_var = tk.StringVar()
        ttk.Entry(time_row, textvariable=self.time_var, width=12).pack(side=tk.LEFT)
        self.ampm_var = tk.StringVar(value="AM")
        ttk.Combobox(time_row, textvariable=self.ampm_var, values=["AM", "PM"], state="readonly", width=5).pack(side=tk.LEFT, padx=(8, 0))

        row += 1
        ttk.Label(form, text="Repeat").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.repeat_var = tk.StringVar(value="Daily")
        ttk.Combobox(form, textvariable=self.repeat_var, values=["Once", "Daily", "Weekly"], state="readonly", width=18).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=4)

        row += 1
        ttk.Label(form, text="Priority").grid(row=row, column=0, sticky=tk.W, pady=4)
        self.priority_var = tk.StringVar(value="Normal")
        ttk.Combobox(form, textvariable=self.priority_var, values=["Low", "Normal", "High"], state="readonly", width=18).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=4)

        # Image (optional)
        row += 1
        ttk.Label(form, text="Image").grid(row=row, column=0, sticky=tk.W, pady=4)
        img_row = ttk.Frame(form)
        img_row.grid(row=row, column=1, sticky=(tk.W, tk.E))
        self.image_label = ttk.Label(img_row, text="No image selected")
        self.image_label.pack(side=tk.LEFT)
        RoundedAnimatedButton(img_row, text="Choose", command=self.choose_image, base=self.button_base, hover=self.button_hover, active=self.button_active).pack(side=tk.RIGHT, padx=(8, 0))

        # Sound controls removed; app always uses default sound

        # Actions
        row += 1
        actions = ttk.Frame(form)
        actions.grid(row=row, column=0, columnspan=2, pady=(12, 4))
        RoundedAnimatedButton(actions, text="Create", command=self.create_notification, base=self.button_base, hover=self.button_hover, active=self.button_active).pack(side=tk.LEFT, padx=8)
        RoundedAnimatedButton(actions, text="Update", command=self.update_notification, base=self.button_base, hover=self.button_hover, active=self.button_active).pack(side=tk.LEFT, padx=8)
        RoundedAnimatedButton(actions, text="Delete", command=self.delete_notification, base=self.button_base, hover=self.button_hover, active=self.button_active).pack(side=tk.LEFT, padx=8)
        RoundedAnimatedButton(actions, text="Clear", command=self.clear_form, base=self.button_base, hover=self.button_hover, active=self.button_active).pack(side=tk.LEFT, padx=8)
        RoundedAnimatedButton(actions, text="Send Test", command=self.send_test_notification, base=self.button_base, hover=self.button_hover, active=self.button_active).pack(side=tk.LEFT, padx=8)

    def _build_list(self):
        list_frame = ttk.LabelFrame(self.right, text="Notifications", padding=12)
        list_frame.pack(fill=tk.BOTH, expand=True)

        columns = ("title", "message", "date", "time", "repeat", "priority")
        self.tree = ttk.Treeview(list_frame, columns=columns, show="headings", selectmode="browse")
        for col, text, w in [
            ("title", "Title", 160),
            ("message", "Message", 280),
            ("date", "Date", 90),
            ("time", "Time", 70),
            ("repeat", "Repeat", 80),
            ("priority", "Priority", 80),
        ]:
            self.tree.heading(col, text=text)
            self.tree.column(col, width=w, anchor=tk.W)
        self.tree.pack(fill=tk.BOTH, expand=True)
        self.tree.bind("<<TreeviewSelect>>", self.item_selected)

        # Row styles via tags
        try:
            self.tree.tag_configure("High", background="#2b0000", foreground="#ffb3b3")
            self.tree.tag_configure("Normal", background="#001a0f", foreground="#cfe9df")
            self.tree.tag_configure("Low", background="#001a33", foreground="#cfe1ff")
        except Exception:
            pass

        self.refresh_list()

    # ---------- File/asset helpers ----------
    def _first_existing(self, paths):
        for p in paths:
            if p and os.path.exists(p):
                return p
        return None

    # ---------- Media pickers ----------
    # Sound selection removed; app always uses default sound

    def choose_image(self):
        filetypes = [("Images", "*.png;*.jpg;*.jpeg;*.bmp;*.gif;*.ico"), ("All files", "*.*")]
        image_path = filedialog.askopenfilename(title="Choose notification image", filetypes=filetypes)
        if not image_path:
            return
        try:
            img = Image.open(image_path)
            temp_dir = os.path.join(self.base_dir, "temp")
            os.makedirs(temp_dir, exist_ok=True)
            img = img.convert("RGBA")
            img.thumbnail((400, 220), Image.Resampling.LANCZOS)
            temp_image_path = os.path.join(temp_dir, f"notif_{int(time.time())}.png")
            img.save(temp_image_path, "PNG")
            self.image_path = temp_image_path
            self.image_label.config(text=os.path.basename(image_path))
        except Exception as e:
            messagebox.showerror("Error", f"Failed to process image: {e}")
            self.image_path = None
            self.image_label.config(text="No image selected")

    # ---------- CRUD ----------
    def _validate_inputs(self, for_update=False):
        title = self.title_var.get().strip()
        message = self.message_var.get().strip()
        date_str = self.date_var.get().strip()
        time_str = self.time_var.get().strip()
        repeat = self.repeat_var.get()
        priority = self.priority_var.get()

        if not all([title, message, time_str, repeat, priority]):
            messagebox.showerror("Validation", "Title, Message, Time, Repeat and Priority are required.")
            return None

        try:
            _ = datetime.strptime(time_str, "%H:%M")
        except ValueError:
            messagebox.showerror("Validation", "Time must be HH:MM.")
            return None

        hh, mm = time_str.split(":")
        hour = int(hh)
        amp = self.ampm_var.get()
        if amp == "AM":
            hour = 0 if hour == 12 else hour
        else:
            hour = 12 if hour == 12 else hour + 12
        time_24 = f"{hour:02d}:{int(mm):02d}"

        if repeat == "Once":
            if not date_str:
                messagebox.showerror("Validation", "Date is required for one-time reminders.")
                return None
            try:
                datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                messagebox.showerror("Validation", "Date must be YYYY-MM-DD.")
                return None
        else:
            if date_str:
                try:
                    datetime.strptime(date_str, "%Y-%m-%d")
                except ValueError:
                    messagebox.showerror("Validation", "Date must be YYYY-MM-DD.")
                    return None

        return {
            "title": title,
            "message": message,
            "date": date_str,
            "time": time_24,
            "repeat": repeat,
            "priority": priority,
        }

    def create_notification(self):
        data = self._validate_inputs()
        if not data:
            return

        image_b64 = None
        if self.image_path and os.path.exists(self.image_path):
            try:
                with open(self.image_path, "rb") as f:
                    image_b64 = base64.b64encode(f.read()).decode("utf-8")
            except Exception:
                image_b64 = None

        notif = {
            **data,
            "image": image_b64,
            # scheduling memory
            "delivered": False,
            "last_fired_date": None,
            "last_fired_week": None,
            "created_weekday": datetime.strptime(data["date"], "%Y-%m-%d").weekday() if data["date"] else datetime.now().weekday(),
        }

        self.notifications.append(notif)
        self.save_notifications()
        self.refresh_list()
        self.clear_form()

    def update_notification(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Update", "Select a notification to update.")
            return
        index = self.tree.index(selected[0])

        data = self._validate_inputs(for_update=True)
        if not data:
            return

        image_b64 = self.notifications[index].get("image")
        if self.image_path and os.path.exists(self.image_path):
            try:
                with open(self.image_path, "rb") as f:
                    image_b64 = base64.b64encode(f.read()).decode("utf-8")
            except Exception:
                pass

        self.notifications[index].update({
            **data,
            "image": image_b64,
            # Reset scheduling flags on update
            "delivered": False if data["repeat"] == "Once" else self.notifications[index].get("delivered", False),
            "last_fired_date": None,
            "last_fired_week": None,
            "created_weekday": datetime.strptime(data["date"], "%Y-%m-%d").weekday() if data["date"] else datetime.now().weekday(),
        })

        self.save_notifications()
        self.refresh_list()
        self.clear_form()

    def delete_notification(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Delete", "Select a notification to delete.")
            return
        if not messagebox.askyesno("Confirm", "Delete selected notification?"):
            return
        index = self.tree.index(selected[0])
        self.notifications.pop(index)
        self.save_notifications()
        self.refresh_list()
        self.clear_form()

    # ---------- List interactions ----------
    def item_selected(self, _event):
        selected = self.tree.selection()
        if not selected:
            return
        index = self.tree.index(selected[0])
        notif = self.notifications[index]
        self.title_var.set(notif.get("title", ""))
        self.message_var.set(notif.get("message", ""))
        self.date_var.set(notif.get("date", ""))
        t24 = notif.get("time", "")
        try:
            hh, mm = t24.split(":")
            h = int(hh)
            amp = "AM" if h < 12 else "PM"
            h12 = 12 if h % 12 == 0 else h % 12
            self.time_var.set(f"{h12:02d}:{int(mm):02d}")
            self.ampm_var.set(amp)
        except Exception:
            self.time_var.set(t24)
            self.ampm_var.set("AM")
        self.repeat_var.set(notif.get("repeat", "Once"))
        self.priority_var.set(notif.get("priority", "Normal"))

        if notif.get("image"):
            try:
                raw = base64.b64decode(notif["image"])
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                    tmp.write(raw)
                    self.image_path = tmp.name
                self.image_label.config(text="(embedded)")
            except Exception:
                self.image_path = None
                self.image_label.config(text="No image selected")
        else:
            self.image_path = None
            self.image_label.config(text="No image selected")

    def clear_form(self):
        self.title_var.set("")
        self.message_var.set("")
        self.date_var.set("")
        self.time_var.set("")
        self.repeat_var.set("Once")
        self.priority_var.set("Normal")
        self.image_path = None
        self.image_label.config(text="No image selected")

    def refresh_list(self):
        for item in self.tree.get_children():
            self.tree.delete(item)

        for notif in self.notifications:
            tag = notif.get("priority", "Normal")
            self.tree.insert('', tk.END, values=(
                notif.get("title", ""),
                notif.get("message", ""),
                notif.get("date", ""),
                notif.get("time", ""),
                notif.get("repeat", "Once"),
                notif.get("priority", "Normal"),
            ), tags=(tag,))

    # ---------- Persistence ----------
    def load_notifications(self):
        path = os.path.join(self.base_dir, "notifications.json")
        if not os.path.exists(path):
            return []
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            messagebox.showwarning("Load", f"Failed to load notifications: {e}")
            return []

    def save_notifications(self):
        path = os.path.join(self.base_dir, "notifications.json")
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(self.notifications, f, ensure_ascii=False, indent=2)
        except Exception as e:
            messagebox.showerror("Save", f"Failed to save notifications: {e}")

    # ---------- Scheduling ----------
    def _time_matches_now(self, time_str):
        try:
            return datetime.now().strftime("%H:%M") == time_str
        except Exception:
            return False

    def _should_fire(self, notif):
        now = datetime.now()
        repeat = notif.get("repeat", "Once")
        time_str = notif.get("time", "00:00")
        date_str = notif.get("date")

        if repeat == "Once":
            if notif.get("delivered"):
                return False
            if not date_str:
                return False
            try:
                due_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
            except Exception:
                return False
            # Fire once at the exact minute or if time already passed this minute
            return now.strftime("%Y-%m-%d %H:%M") == due_dt.strftime("%Y-%m-%d %H:%M")

        if repeat == "Daily":
            if not self._time_matches_now(time_str):
                return False
            last = notif.get("last_fired_date")
            return last != now.strftime("%Y-%m-%d")

        if repeat == "Weekly":
            if now.weekday() != int(notif.get("created_weekday", now.weekday())):
                return False
            if not self._time_matches_now(time_str):
                return False
            last_week = notif.get("last_fired_week")
            year, weeknum, _ = now.isocalendar()
            current_week = f"{year}-W{weeknum}"
            return last_week != current_week

        return False

    def _mark_fired(self, notif):
        now = datetime.now()
        repeat = notif.get("repeat", "Once")
        if repeat == "Once":
            notif["delivered"] = True
        elif repeat == "Daily":
            notif["last_fired_date"] = now.strftime("%Y-%m-%d")
        elif repeat == "Weekly":
            year, weeknum, _ = now.isocalendar()
            notif["last_fired_week"] = f"{year}-W{weeknum}"

    def check_notifications(self):
        while True:
            try:
                fired_any = False
                for notif in list(self.notifications):
                    if self._should_fire(notif):
                        image_path = None
                        if notif.get("image"):
                            try:
                                raw = base64.b64decode(notif["image"])
                                temp_dir = os.path.join(self.base_dir, "temp")
                                os.makedirs(temp_dir, exist_ok=True)
                                temp_path = os.path.join(temp_dir, f"img_{int(time.time())}.png")
                                with open(temp_path, "wb") as f:
                                    f.write(raw)
                                image_path = temp_path
                            except Exception:
                                image_path = None

                        self.send_notification(
                            title=notif.get("title", ""),
                            message=notif.get("message", ""),
                            image_path=image_path,
                        )

                        self._mark_fired(notif)
                        # Debug print for visibility
                        print(f"[Notifier] Fired: {notif.get('title','')} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                        fired_any = True

                        # cleanup temp image
                        if image_path and os.path.exists(image_path):
                            try:
                                os.unlink(image_path)
                            except Exception:
                                pass

                if fired_any:
                    self.save_notifications()
            except Exception:
                pass
            # Poll every 5 seconds for more responsive firing
            time.sleep(5)

    # ---------- Notification delivery ----------
    def _play_sound(self):
        if platform.system() != "Windows":
            return
        try:
            if self.default_sound and os.path.exists(self.default_sound):
                winsound.PlaySound(self.default_sound, winsound.SND_FILENAME | winsound.SND_ASYNC)
            else:
                winsound.MessageBeep()
        except Exception:
            try:
                winsound.MessageBeep()
            except Exception:
                pass

    def send_notification(self, title, message, image_path=None):
        # Route delivery on Tk main thread to avoid cross-thread issues
        try:
            self.root.after(0, lambda: self._deliver_notification(title, message, image_path))
        except Exception:
            # Fallback to direct call
            self._deliver_notification(title, message, image_path)

    def _deliver_notification(self, title, message, image_path=None):
        # Play default sound first (Windows)
        self._play_sound()

        # Prefer win10toast (often more reliable), then winotify, then plyer
        if self.toaster is not None:
            try:
                self.toaster.show_toast(title=title, msg=message, icon_path=self.icon_path or self.default_icon, duration=8, threaded=True)
                return
            except Exception:
                pass

        if os.name == 'nt' and WINDOWS_NOTIFICATIONS_AVAILABLE and Notification is not None:
            try:
                toast = Notification(
                    app_id="NotifierApp",
                    title=title,
                    msg=message,
                    icon=self.icon_path or self.default_icon,
                    duration="long",
                )
                toast.show()
                return
            except Exception:
                pass

        if PLYER_AVAILABLE and plyer_notification is not None:
            try:
                plyer_notification.notify(
                title=title,
                message=message,
                timeout=10,
                app_name="Task & Reminder Notifier"
                )
                return
            except Exception:
                pass

        # Last resort dialog
        try:
            messagebox.showinfo(title, message)
        except Exception:
            pass

    def send_test_notification(self):
        now_text = datetime.now().strftime("%H:%M:%S")
        self.send_notification("Test Notification", f"It works! {now_text}")

    def _on_close(self):
        if self.run_bg_var.get() and PYSTRAY_AVAILABLE:
            try:
                self._start_tray()
                self.root.withdraw()
                return
            except Exception:
                pass
        self.root.destroy()

    def _start_tray(self):
        if not PYSTRAY_AVAILABLE:
            return
        if hasattr(self, "tray") and self.tray:
            return
        icon_img_path = self.icon_path or self.default_icon
        if icon_img_path and os.path.exists(icon_img_path):
            tray_image = Image.open(icon_img_path)
        else:
            tray_image = Image.new("RGBA", (64, 64), (80, 120, 200, 255))
        menu = pystray.Menu(
            pystray.MenuItem("Show", self._tray_show),
            pystray.MenuItem("Quit", self._tray_quit),
        )
        self.tray = pystray.Icon("NotifierApp", tray_image, "NotifierApp", menu)
        t = threading.Thread(target=self.tray.run, daemon=True)
        t.start()

    def _tray_show(self):
        try:
            self.root.after(0, self._do_show)
        except Exception:
            pass

    def _do_show(self):
        self.root.deiconify()
        if hasattr(self, "tray") and self.tray:
            try:
                self.tray.stop()
            except Exception:
                pass
            self.tray = None

    def _tray_quit(self):
        try:
            if hasattr(self, "tray") and self.tray:
                self.tray.stop()
        except Exception:
            pass
        self.root.after(0, self.root.destroy)


def main():
    root = tk.Tk()
    NotifierApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()

