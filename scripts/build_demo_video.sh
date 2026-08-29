#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NARRATION_DIR="$PROJECT_DIR/scripts/demo_narration"
SCREEN_DIR="$PROJECT_DIR/output/demo/screens"
AUDIO_DIR="$PROJECT_DIR/output/demo/audio"
SEGMENT_DIR="$PROJECT_DIR/tmp/demo-video"
FINAL_DIR="$PROJECT_DIR/output/demo"

mkdir -p "$AUDIO_DIR" "$SEGMENT_DIR" "$FINAL_DIR"

screens=(
  "01-overview-light.png"
  "02-overview-dark.png"
  "03-reply-result-dark.png"
  "04-qa-result-dark.png"
  "05-retention-result-dark.png"
  "06-bug-result-dark.png"
  "07-config-dark.png"
  "08-evidence-dark.png"
)

scripts=(
  "01-intro.txt"
  "02-mapping.txt"
  "03-reply.txt"
  "04-qa.txt"
  "05-retention.txt"
  "06-bug.txt"
  "07-config.txt"
  "08-evidence.txt"
)

: > "$SEGMENT_DIR/segments.ffconcat"
printf 'ffconcat version 1.0\n' > "$SEGMENT_DIR/segments.ffconcat"

for index in "${!screens[@]}"; do
  number=$(printf '%02d' "$((index + 1))")
  audio="$AUDIO_DIR/$number.aiff"
  segment="$SEGMENT_DIR/$number.mp4"
  say -v Samantha -r 158 -f "$NARRATION_DIR/${scripts[$index]}" -o "$audio"
  ffmpeg -loglevel error -y \
    -loop 1 -i "$SCREEN_DIR/${screens[$index]}" -i "$audio" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0f1411,setsar=1,format=yuv420p" \
    -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 -tune stillimage -r 30 \
    -c:a aac -b:a 160k -shortest -movflags +faststart "$segment"
  printf "file '%s'\n" "$segment" >> "$SEGMENT_DIR/segments.ffconcat"
done

ffmpeg -loglevel error -y -f concat -safe 0 -i "$SEGMENT_DIR/segments.ffconcat" -c copy -movflags +faststart "$FINAL_DIR/Support-Lab-Demo.mp4"
ffprobe -v error \
  -show_entries stream=index,codec_name,width,height,r_frame_rate,bit_rate \
  -show_entries format=duration,size,bit_rate \
  -of default=noprint_wrappers=1 "$FINAL_DIR/Support-Lab-Demo.mp4"
