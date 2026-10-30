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
