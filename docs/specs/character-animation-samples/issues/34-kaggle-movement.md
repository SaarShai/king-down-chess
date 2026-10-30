# Kaggle movement in-betweens

Status: claimed

## Plan and checks

- Copy and hash-check the movement keys and runtime into one private dataset.
- Run the midpoint plan on a private GPU kernel, with the available interpolation models.
- Pull and inspect the results, record scores and GPU time, and keep the results outside Git.
- Test the helper, open the staging pull request, and check its CI.

## Run

On 2026-10-30, the owner requested the GPU movement run. The source check finds 264 banks, 972 key references and
962 unique key files. The bank, key and runtime hashes match. The private dataset is ready. The private GPU job starts
at 16:35 UTC with `node tools/anim/kaggle/kaggle.mjs push saarshai 0 1 <scratch>`. The server metadata confirms that
the dataset and model are attached and internet access is off. The job records a split request if its projected time
is over eight hours. Results remain outside Git.

The first run found the dataset at a different mount path. The second run processed 50 entries and 208 gaps with both
methods, then ran out of GPU memory. TensorFlow retained the memory that RIFE needed. The third run exposed a device
selection conflict when TensorFlow changed the default GPU. The fourth run assigns every PyTorch allocation to GPU 0
and puts TensorFlow on GPU 1. The measured pace of the second run projects about 1.1 hours for the full set.

The fourth run completed all 264 entries and 972 gaps in 4,551 seconds on two T4 GPUs. It wrote 5,832 RGBA
in-betweens and one sheet per entry. The score is a screen, not a ghost verdict. RIFE scores lower on 965 gaps;
the FILM flow variant scores lower on seven. Their mean scores are 0.0518 and 0.1042. The FILM variant uses equal
blend weights for alpha, so this is not a test of the model's learned RGB fusion. The results and visual review stay
outside Git. The earlier second run stopped after 871 seconds when GPU memory ran out.

The metadata, archive and summary tests pass with `KINGDOWN_TEST_FILE=tools/anim/kaggle.test.ts npm test`.
PR #221 targets `staging/first-game`. Its checks pass at `c68b09a4`; check the final head again.
