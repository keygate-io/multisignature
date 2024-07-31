load test_helper/bats-support/load.bash
load test_helper/bats-assert/load.bash

setup() {
  dfx stop
  dfx start --clean --background
}

# executed after each test
teardown() {
  dfx stop
}

@test "Can say hello" {
    dfx deploy
    run dfx canister call account hello
    assert_output '("hello")'
}

