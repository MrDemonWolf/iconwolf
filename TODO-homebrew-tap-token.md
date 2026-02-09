# Setup: HOMEBREW_TAP_TOKEN for auto-updating the Homebrew tap

The GitHub Action at `.github/workflows/update-homebrew.yml` automatically updates the `homebrew-den` tap formula whenever you publish a new release on the iconwolf repo. It needs a personal access token to push to the tap repo.

## Steps

1. **Create a fine-grained PAT**
   - Go to https://github.com/settings/personal-access-tokens/new
   - Token name: `iconwolf-homebrew-tap`
   - Expiration: pick whatever you're comfortable with (90 days, 1 year, etc.)
   - Resource owner: `MrDemonWolf`
   - Repository access: **Only select repositories** → select `MrDemonWolf/homebrew-den`
   - Permissions → Repository permissions:
     - **Contents**: Read and write
   - Click **Generate token** and copy it

2. **Add the token as a secret to the iconwolf repo**
   - Go to https://github.com/MrDemonWolf/iconwolf/settings/secrets/actions
   - Click **New repository secret**
   - Name: `HOMEBREW_TAP_TOKEN`
   - Value: paste the token from step 1
   - Click **Add secret**

3. **Test it**
   - Create a new release on iconwolf (bump version in `package.json` + `src/index.ts` first)
   - The action will automatically compute the sha256 and push the updated formula to `homebrew-den`

## How it works

When you publish a release (e.g. `v0.1.0`):
1. The workflow downloads the source tarball from the release tag
2. Computes the sha256 checksum
3. Writes an updated `Formula/iconwolf.rb` with the new version, URL, and hash
4. Commits and pushes to `MrDemonWolf/homebrew-den`

No manual formula updates needed after this is set up.
