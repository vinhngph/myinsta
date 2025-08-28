import subprocess
import re
import os
from app.extensions import socketio


def run_ffmpeg(task_id, raw_path, output_path):
    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            raw_path,
        ],
        capture_output=True,
        text=True,
    )
    total_duration = float(probe.stdout.strip())

    process = subprocess.Popen(
        [
            "ffmpeg",
            "-i",
            raw_path,
            "-c:v",
            "libx264",
            "-preset",
            "ultrafast",
            "-crf",
            "23",
            "-c:a",
            "aac",
            "-threads",
            "1",
            "-bufsize",
            "1M",
            output_path,
            "-y",
        ],
        stderr=subprocess.PIPE,
        universal_newlines=True,
    )

    for line in process.stderr:
        match = re.search(r"time=(\d+:\d+:\d+\.\d+)", line)
        if match:
            h, m, s = match.group(1).split(":")
            current_time = int(h) * 3600 + int(m) * 60 + float(s)
            percent = (current_time / total_duration) * 100
            socketio.emit(
                "progress", {"task_id": task_id, "progress": round(percent, 2)}
            )
    process.wait()

    if os.path.exists(raw_path):
        os.remove(raw_path)
    socketio.emit("progress", {"task_id": task_id, "progress": 100.0})
