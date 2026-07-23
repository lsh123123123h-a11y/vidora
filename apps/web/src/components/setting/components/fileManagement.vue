<template>
  <div class="fileManagement">
    <t-empty :description="$t('settings.file.dockerDesc')">
      <template #image>
        <i-reduce-one theme="outline" fill="red" />
      </template>
    </t-empty>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.folderList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.folderItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--td-component-border);
  border-radius: var(--td-radius-default);
}

.folderName {
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.folderDesc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
</style>
