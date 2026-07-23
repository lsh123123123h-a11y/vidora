<template>
  <div class="about">
    <t-card bordered :style="{ width: '100%' }" class="logoCard">
      <div class="f">
        <img src="/vidora-logo.jpg" alt="Vidora Logo" class="logo" />
        <div class="appName">
          <div class="name">Vidora</div>
          <div class="data">{{ $t("settings.about.slogan") }}</div>
          <div class="version">
            <t-tag theme="primary" shape="round" size="small" style="padding: 10px">v{{ version }}</t-tag>
          </div>
        </div>
      </div>
    </t-card>
    <div class="codeRepository">
      <span>{{ $t("settings.about.codeRepository") }}</span>
      <t-card bordered :style="{ width: '100%' }" class="logoCard">
        <div class="ac jb" style="cursor: pointer" @click="openLink('https://github.com/lsh123123123h-a11y/vidora')">
          <div class="f">
            <div class="github">
              <i-github fill="#000" theme="outline" size="22" class="c" style="width: 100%; height: 100%" />
            </div>
            <div style="margin-left: 15px">
              <div>
                <span style="font-size: 15px; font-weight: 900">{{ $t("settings.about.githubRepo") }}</span>
              </div>
              <div>
                <span style="font-size: 12px; color: #666">https://github.com/lsh123123123h-a11y/vidora</span>
              </div>
            </div>
          </div>
          <i-right theme="outline" size="18" />
        </div>
      </t-card>
    </div>
    <div class="license">
      <span>{{ $t("settings.about.license") }}</span>
      <t-card bordered :style="{ width: '100%' }" class="logoCard">
        <div class="ac jb" style="cursor: pointer" @click="openLink('https://github.com/lsh123123123h-a11y/vidora')">
          <div class="f">
            <div class="data">
              <i-notes fill="#000" theme="outline" size="20" class="c" style="width: 100%; height: 100%" />
            </div>
            <div style="margin-left: 15px">
              <div>
                <span style="font-size: 15px; font-weight: 900">Apache-2.0 License</span>
              </div>
              <div>
                <span style="font-size: 12px; color: #666">{{ $t("settings.about.licenseDesc") }}</span>
              </div>
            </div>
          </div>
          <i-right theme="outline" size="18" />
        </div>
      </t-card>
    </div>

  </div>
</template>

<script setup lang="ts">
import axios from "@/utils/axios";
import store from "@/stores/index";

const { version } = storeToRefs(store());

async function openLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

onMounted(async () => {
  const { data } = await axios.get("/other/getVersion");
  version.value = data;
});

</script>

<style lang="scss" scoped>
.about {
  .logoCard {
    padding: 15px;
    .logo {
      width: 72px;
      height: 72px;
      border-radius: 16px;
      background-color: #ececec;
    }
    .appName {
      width: 90%;
      margin-left: 20px;
      .name {
        font-weight: 900;
        font-size: 20px;
      }
      .data {
        margin-top: 5px;
        font-size: 12px;
        color: #666;
      }
      .version {
        margin-top: 5px;
        font-size: 14px;
        color: #666;
      }
    }
  }
  .logoCard {
    margin-top: 5px;
  }
  span {
    font-size: 12px;
    font-weight: 500;
  }
  .codeRepository {
    margin-top: 15px;
    .github {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      background-color: #ececec;
    }
  }
  .versionUpdate {
    margin-top: 15px;
    .checkForUpdates {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      background-color: #ececec;
    }
  }
  .license {
    margin-top: 15px;
    .data {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      background-color: #ececec;
    }
  }
  .updateDialog {
    .updateHeader {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 20px;
      .updateIcon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--td-brand-color-light, rgba(0, 82, 217, 0.08));
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }
      .updateTitle {
        font-size: 18px;
        font-weight: 700;
        color: var(--td-text-color-primary);
      }
    }

    .versionCompare {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
      padding: 16px;
      background: var(--td-bg-color-container-hover, #f5f5f5);
      border-radius: 12px;

      .versionCard {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex: 1;

        .versionLabel {
          font-size: 12px;
          color: var(--td-text-color-secondary, #999);
          font-weight: 500;
        }
      }

      .arrow {
        display: flex;
        align-items: center;
        padding: 0 4px;
      }
    }

    .versionTime {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin: -8px 0 20px;

      .versionTimeLabel {
        font-size: 12px;
        color: var(--td-text-color-secondary, #999);
      }

      .versionTimeValue {
        font-size: 12px;
        color: var(--td-text-color-primary);
        font-weight: 500;
      }
    }

    .sourceSelect {
      .sourceTitle {
        font-size: 14px;
        font-weight: 600;
        color: var(--td-text-color-primary);
        margin-bottom: 12px;
        display: block;
      }

      .sourceCards {
        display: flex;
        gap: 12px;

        .sourceCard {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          border-radius: 10px;
          border: 2px solid var(--td-border-level-2-color, #e7e7e7);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          background: var(--td-bg-color-container);

          &:hover {
            border-color: var(--td-brand-color-hover, #4787f0);
            background: var(--td-brand-color-light, rgba(0, 82, 217, 0.04));
          }

          &.active {
            border-color: var(--td-brand-color);
            background: var(--td-brand-color-light, rgba(0, 82, 217, 0.06));
          }

          &.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background: var(--td-bg-color-container-hover, #f5f5f5);

            &:hover {
              border-color: var(--td-border-level-2-color, #e7e7e7);
              background: var(--td-bg-color-container-hover, #f5f5f5);
            }
          }

          .sourceIcon {
            width: 44px;
            height: 44px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.github {
              background: #24292e;
              color: #fff;
            }

            &.gitee {
              background: #c71d23;
              color: #fff;
            }
          }

          .sourceName {
            font-size: 14px;
            font-weight: 600;
            color: var(--td-text-color-primary);
          }

          .checkMark {
            position: absolute;
            top: 8px;
            right: 8px;
          }
        }
      }
    }
  }
}
</style>
