<template>
  <div class="wallet-page">
    <h2 class="title">{{ wallet.address.base58 }}</h2>
    <div class="chain-info">
      <article class="currency">
        <img src="@/assets/tron.png" alt="" />
        <b>&nbsp;Tron</b>
      </article>
      <article class="balance">
        <b>{{ wallet.balance }}</b> TRX
      </article>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    wallet() {
      const address = this.$route.params.address;
      console.log(address);
      return this.$store.getters.getWalletByAddress(address);
    },
  },
};
</script>

<style lang="scss">
.wallet-page {
  background: rgb(31, 30, 59);
  border-radius: 30px;
  color: #fff;
  padding: 4rem 2rem;
}

.title {
  margin: 0;
}
.currency {
  display: flex;
  font-size: 2rem;
}

.balance {
  font-size: 2rem;
  margin-left: 3rem;
}

.chain-info {
  display: flex;
  margin-top: 2rem;
}
</style>
