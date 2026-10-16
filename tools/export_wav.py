from pathlib import Path
import json,base64,wave
R=Path(__file__).resolve().parents[1];out=R/'audio/wav';out.mkdir(parents=True,exist_ok=True)
for filename,prefix,end in [('combat-sound-bank.js','const COMBAT_SOUND_BANK=',';'),('interaction-sound-bank.js','Object.assign(COMBAT_SOUND_BANK,',');')]:
 text=(R/'game/assets'/filename).read_text();bank=json.loads(text.split(prefix,1)[1].strip().removesuffix(end))
 for name,variants in bank.items():
  for i,data in enumerate(variants):
   with wave.open(str(out/f'{name}-{i+1}.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(32000);w.writeframes(base64.b64decode(data))
print('Exported',len(list(out.glob('*.wav'))),'WAV samples')
